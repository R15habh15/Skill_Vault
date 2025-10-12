const express = require('express');
const { Pool } = require('pg');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

// Razorpay instance
const razorpay = new Razorpay({
    key_id: 'rzp_test_RM63ZT0AQ0JWv7',
    key_secret: 'fB3zeaS0xwRHkkMcT5k5V0sG'
});

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'skillvault',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432,
});

// Create Razorpay order for credit purchase
router.post('/create-order', async (req, res) => {
    try {
        const { amount, credits, userId } = req.body;
        
        // Validate input
        if (!amount || !credits || !userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Create order with Razorpay
        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `vcreds_${Date.now()}`,
            notes: {
                userId: userId,
                credits: credits,
                type: 'vcreds_purchase'
            }
        };

        const order = await razorpay.orders.create(options);
        
        // Store order in database
        await pool.query(
            `INSERT INTO credit_orders (order_id, user_id, amount, credits, status, created_at) 
             VALUES ($1, $2, $3, $4, 'pending', NOW())`,
            [order.id, userId, amount, credits]
        );

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create order' 
        });
    }
});

// Verify payment and add credits
router.post('/verify-payment', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            userId 
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', 'fB3zeaS0xwRHkkMcT5k5V0sG')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment signature' 
            });
        }

        // Get order details
        const orderResult = await pool.query(
            'SELECT * FROM credit_orders WHERE order_id = $1 AND user_id = $2',
            [razorpay_order_id, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const order = orderResult.rows[0];

        // Start transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Update order status
            await client.query(
                `UPDATE credit_orders 
                 SET status = 'completed', payment_id = $1, updated_at = NOW() 
                 WHERE order_id = $2`,
                [razorpay_payment_id, razorpay_order_id]
            );

            // Add credits to user account
            await client.query(
                `INSERT INTO user_credits (user_id, credits, transaction_type, transaction_id, description, created_at)
                 VALUES ($1, $2, 'purchase', $3, 'VCreds purchase', NOW())
                 ON CONFLICT (user_id) 
                 DO UPDATE SET 
                    credits = user_credits.credits + $2,
                    updated_at = NOW()`,
                [userId, order.credits, razorpay_payment_id]
            );

            // Log transaction
            await client.query(
                `INSERT INTO credit_transactions (user_id, type, amount, credits, payment_id, status, created_at)
                 VALUES ($1, 'purchase', $2, $3, $4, 'completed', NOW())`,
                [userId, order.amount, order.credits, razorpay_payment_id]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Payment verified and credits added',
                credits: order.credits
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify payment' 
        });
    }
});

// Transfer credits from company to freelancer
router.post('/transfer-credits', async (req, res) => {
    try {
        const { fromUserId, toUserId, credits, description, projectId } = req.body;

        // Validate input
        if (!fromUserId || !toUserId || !credits || credits <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid transfer details' 
            });
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Check sender's balance
            const senderResult = await client.query(
                'SELECT credits FROM user_credits WHERE user_id = $1',
                [fromUserId]
            );

            if (senderResult.rows.length === 0 || senderResult.rows[0].credits < credits) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Insufficient credits' 
                });
            }

            // Deduct credits from sender
            await client.query(
                `UPDATE user_credits 
                 SET credits = credits - $1, updated_at = NOW() 
                 WHERE user_id = $2`,
                [credits, fromUserId]
            );

            // Add credits to receiver
            await client.query(
                `INSERT INTO user_credits (user_id, credits, transaction_type, description, created_at)
                 VALUES ($1, $2, 'received', $3, NOW())
                 ON CONFLICT (user_id) 
                 DO UPDATE SET 
                    credits = user_credits.credits + $2,
                    updated_at = NOW()`,
                [toUserId, credits, description || 'Payment received']
            );

            // Log sender transaction
            await client.query(
                `INSERT INTO credit_transactions (user_id, type, credits, description, project_id, status, created_at)
                 VALUES ($1, 'sent', $2, $3, $4, 'completed', NOW())`,
                [fromUserId, credits, description || 'Payment sent', projectId]
            );

            // Log receiver transaction
            await client.query(
                `INSERT INTO credit_transactions (user_id, type, credits, description, project_id, status, created_at)
                 VALUES ($1, 'received', $2, $3, $4, 'completed', NOW())`,
                [toUserId, credits, description || 'Payment received', projectId]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Credits transferred successfully'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error transferring credits:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to transfer credits' 
        });
    }
});

// Get user credit balance
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            'SELECT credits FROM user_credits WHERE user_id = $1',
            [userId]
        );

        const credits = result.rows.length > 0 ? result.rows[0].credits : 0;

        res.json({
            success: true,
            credits: credits
        });

    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get balance' 
        });
    }
});

// Get user transaction history
router.get('/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0, type } = req.query;

        let query = `
            SELECT * FROM credit_transactions 
            WHERE user_id = $1
        `;
        let params = [userId];

        if (type) {
            query += ` AND type = ${params.length + 1}`;
            params.push(type);
        }

        query += ` ORDER BY created_at DESC LIMIT ${params.length + 1} OFFSET ${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            transactions: result.rows
        });

    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get transactions' 
        });
    }
});

// Request withdrawal
router.post('/request-withdrawal', async (req, res) => {
    try {
        const { userId, credits, method, accountDetails } = req.body;

        // Validate input
        if (!userId || !credits || credits < 10 || !method) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid withdrawal request' 
            });
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Check user's balance
            const balanceResult = await client.query(
                'SELECT credits FROM user_credits WHERE user_id = $1',
                [userId]
            );

            if (balanceResult.rows.length === 0 || balanceResult.rows[0].credits < credits) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Insufficient credits' 
                });
            }

            // Calculate amounts
            const exchangeRate = 9; // 1 VCred = ₹9 for freelancers
            const grossAmount = credits * exchangeRate;
            const processingFee = Math.round(grossAmount * 0.02); // 2% fee
            const netAmount = grossAmount - processingFee;

            // Create withdrawal request
            const withdrawalResult = await client.query(
                `INSERT INTO withdrawal_requests 
                 (user_id, credits, gross_amount, processing_fee, net_amount, method, account_details, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
                 RETURNING id`,
                [userId, credits, grossAmount, processingFee, netAmount, method, JSON.stringify(accountDetails)]
            );

            const withdrawalId = withdrawalResult.rows[0].id;

            // Deduct credits from user account
            await client.query(
                `UPDATE user_credits 
                 SET credits = credits - $1, updated_at = NOW() 
                 WHERE user_id = $2`,
                [credits, userId]
            );

            // Log transaction
            await client.query(
                `INSERT INTO credit_transactions (user_id, type, credits, description, status, created_at)
                 VALUES ($1, 'withdrawal', $2, 'Withdrawal request', 'pending', NOW())`,
                [userId, credits]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Withdrawal request submitted',
                withdrawalId: withdrawalId,
                netAmount: netAmount
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process withdrawal' 
        });
    }
});

// Get withdrawal requests (admin)
router.get('/withdrawals', async (req, res) => {
    try {
        const { status = 'pending', limit = 50, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT w.*, u.username, u.email 
             FROM withdrawal_requests w
             JOIN users u ON w.user_id = u.id
             WHERE w.status = $1
             ORDER BY w.created_at DESC
             LIMIT $2 OFFSET $3`,
            [status, limit, offset]
        );

        res.json({
            success: true,
            withdrawals: result.rows
        });

    } catch (error) {
        console.error('Error getting withdrawals:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get withdrawals' 
        });
    }
});

// Process withdrawal (admin)
router.post('/process-withdrawal/:withdrawalId', async (req, res) => {
    try {
        const { withdrawalId } = req.params;
        const { status, transactionId, notes } = req.body;

        if (!['completed', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Get withdrawal details
            const withdrawalResult = await client.query(
                'SELECT * FROM withdrawal_requests WHERE id = $1',
                [withdrawalId]
            );

            if (withdrawalResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ 
                    success: false, 
                    message: 'Withdrawal not found' 
                });
            }

            const withdrawal = withdrawalResult.rows[0];

            // Update withdrawal status
            await client.query(
                `UPDATE withdrawal_requests 
                 SET status = $1, transaction_id = $2, notes = $3, processed_at = NOW()
                 WHERE id = $4`,
                [status, transactionId, notes, withdrawalId]
            );

            // If rejected, refund credits
            if (status === 'rejected') {
                await client.query(
                    `UPDATE user_credits 
                     SET credits = credits + $1, updated_at = NOW() 
                     WHERE user_id = $2`,
                    [withdrawal.credits, withdrawal.user_id]
                );

                // Update transaction status
                await client.query(
                    `UPDATE credit_transactions 
                     SET status = 'refunded' 
                     WHERE user_id = $1 AND type = 'withdrawal' AND credits = $2 AND status = 'pending'`,
                    [withdrawal.user_id, withdrawal.credits]
                );
            } else {
                // Update transaction status to completed
                await client.query(
                    `UPDATE credit_transactions 
                     SET status = 'completed' 
                     WHERE user_id = $1 AND type = 'withdrawal' AND credits = $2 AND status = 'pending'`,
                    [withdrawal.user_id, withdrawal.credits]
                );
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: `Withdrawal ${status} successfully`
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process withdrawal' 
        });
    }
});

module.exports = router;