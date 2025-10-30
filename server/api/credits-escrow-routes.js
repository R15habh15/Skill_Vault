// Credits and Escrow API Routes
// Add these routes to your server.js file

// Get user credits balance
app.get('/api/credits/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const balanceResult = await pool.query(
            'SELECT credits FROM user_credits WHERE user_id = $1',
            [userId]
        );

        const balance = balanceResult.rows.length > 0 ? balanceResult.rows[0].credits : 0;

        // Get total earned
        const earnedResult = await pool.query(
            'SELECT COALESCE(SUM(credits), 0) as total FROM credit_transactions WHERE user_id = $1 AND type IN ($2, $3) AND status = $4',
            [userId, 'earned', 'project_payment', 'completed']
        );

        // Get pending payments (in escrow)
        const pendingResult = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM escrow_transactions WHERE freelancer_id = $1 AND status = $2',
            [userId, 'held']
        );

        res.json({
            success: true,
            balance: balance,
            totalEarned: earnedResult.rows[0].total,
            pendingPayments: pendingResult.rows[0].total
        });

    } catch (err) {
        console.error('Error fetching credits balance:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch balance' });
    }
});

// Get user credit transactions
app.get('/api/credits/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, limit = 50 } = req.query;

        let query = 'SELECT * FROM credit_transactions WHERE user_id = $1';
        const params = [userId];

        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            transactions: result.rows
        });

    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
});

// Request withdrawal
app.post('/api/credits/withdraw', async (req, res) => {
    const client = await pool.connect();

    try {
        const { userId, amount } = req.body;

        if (!amount || amount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100 VCreds' });
        }

        await client.query('BEGIN');

        // Check balance
        const balanceResult = await client.query(
            'SELECT credits FROM user_credits WHERE user_id = $1',
            [userId]
        );

        if (balanceResult.rows.length === 0 || balanceResult.rows[0].credits < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        // Deduct credits
        await client.query(
            'UPDATE user_credits SET credits = credits - $1, updated_at = NOW() WHERE user_id = $2',
            [amount, userId]
        );

        // Log transaction
        await client.query(
            `INSERT INTO credit_transactions (user_id, type, amount, credits, description, status)
             VALUES ($1, 'withdrawal', $2, $3, $4, 'pending')`,
            [userId, amount * 10, amount, `Withdrawal request - ${amount} VCreds`]
        );

        // Create notification
        await client.query(
            `INSERT INTO notifications (user_id, type, title, message, data, priority)
             VALUES ($1, 'withdrawal_requested', 'Withdrawal Requested', 'Your withdrawal request is being processed', $2, 'normal')`,
            [userId, JSON.stringify({ amount, amountInr: amount * 10 })]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully'
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error requesting withdrawal:', err);
        res.status(500).json({ success: false, message: 'Failed to request withdrawal' });
    } finally {
        client.release();
    }
});

// Create escrow when project starts
app.post('/api/escrow/create', async (req, res) => {
    const client = await pool.connect();

    try {
        const { projectId, companyId, freelancerId, amount } = req.body;

        await client.query('BEGIN');

        // Check company balance
        const balanceResult = await client.query(
            'SELECT credits FROM user_credits WHERE user_id = $1',
            [companyId]
        );

        if (balanceResult.rows.length === 0 || balanceResult.rows[0].credits < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Insufficient credits' });
        }

        // Deduct from company
        await client.query(
            'UPDATE user_credits SET credits = credits - $1, updated_at = NOW() WHERE user_id = $2',
            [amount, companyId]
        );

        // Create escrow
        const escrowResult = await client.query(
            `INSERT INTO escrow_transactions (project_id, company_id, freelancer_id, amount, status)
             VALUES ($1, $2, $3, $4, 'held') RETURNING *`,
            [projectId, companyId, freelancerId, amount]
        );

        // Log transaction
        await client.query(
            `INSERT INTO credit_transactions (user_id, type, amount, credits, description, status)
             VALUES ($1, 'escrow_hold', $2, $3, $4, 'completed')`,
            [companyId, amount * 10, amount, `Escrow hold for project #${projectId}`]
        );

        // Update active_projects with escrow info
        await client.query(
            'UPDATE active_projects SET credits_held = $1, updated_at = NOW() WHERE id = $2',
            [amount, projectId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            escrow: escrowResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating escrow:', err);
        res.status(500).json({ success: false, message: 'Failed to create escrow' });
    } finally {
        client.release();
    }
});
