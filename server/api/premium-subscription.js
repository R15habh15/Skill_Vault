// Premium Subscription API
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

module.exports = (pool) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  // Get all subscription plans
  router.get('/plans', async (req, res) => {
    try {
      const { userType } = req.query;
      
      let query = 'SELECT * FROM subscription_plans WHERE is_active = TRUE';
      const params = [];
      
      if (userType) {
        params.push(userType);
        query += ' AND user_type = $1';
      }
      
      query += ' ORDER BY duration_days ASC';
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        plans: result.rows
      });
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription plans'
      });
    }
  });

  // Get user's current subscription
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const result = await pool.query(`
        SELECT us.*, sp.name as plan_name, sp.features, sp.user_type
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = $1 
        AND us.status = 'active'
        AND us.end_date > NOW()
        ORDER BY us.end_date DESC
        LIMIT 1
      `, [userId]);
      
      res.json({
        success: true,
        subscription: result.rows[0] || null,
        isPremium: result.rows.length > 0
      });
    } catch (err) {
      console.error('Error fetching user subscription:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription'
      });
    }
  });

  // Create Razorpay order for subscription
  router.post('/create-order', async (req, res) => {
    try {
      const { planId, userId } = req.body;
      
      // Get plan details
      const planResult = await pool.query(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [planId]
      );
      
      if (planResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }
      
      const plan = planResult.rows[0];
      
      // Create Razorpay order
      const options = {
        amount: Math.round(plan.price_inr * 100), // Convert to paise
        currency: 'INR',
        receipt: `sub_${Date.now()}`,
        notes: {
          userId: userId,
          planId: planId,
          type: 'premium_subscription'
        }
      };
      
      const order = await razorpay.orders.create(options);
      
      res.json({
        success: true,
        order: order,
        plan: plan
      });
    } catch (err) {
      console.error('Error creating subscription order:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }
  });

  // Verify Razorpay payment and activate subscription
  router.post('/verify-payment', async (req, res) => {
    const client = await pool.connect();
    
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        planId
      } = req.body;
      
      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }
      
      await client.query('BEGIN');
      
      // Get plan details
      const planResult = await client.query(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [planId]
      );
      
      const plan = planResult.rows[0];
      
      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);
      
      // Create subscription
      const subscriptionResult = await client.query(`
        INSERT INTO user_subscriptions 
        (user_id, plan_id, status, end_date, payment_method, payment_id, order_id, amount_paid)
        VALUES ($1, $2, 'active', $3, 'razorpay', $4, $5, $6)
        RETURNING *
      `, [userId, planId, endDate, razorpay_payment_id, razorpay_order_id, plan.price_inr]);
      
      // Log transaction
      await client.query(`
        INSERT INTO subscription_transactions 
        (user_id, subscription_id, transaction_type, payment_method, amount, payment_id, order_id, status)
        VALUES ($1, $2, 'purchase', 'razorpay', $3, $4, $5, 'completed')
      `, [userId, subscriptionResult.rows[0].id, plan.price_inr, razorpay_payment_id, razorpay_order_id]);
      
      // Create notification
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message, priority)
        VALUES ($1, 'system', 'Premium Activated!', $2, 'high')
      `, [userId, `Your ${plan.name} subscription is now active! Enjoy premium benefits.`]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        subscription: subscriptionResult.rows[0],
        message: 'Subscription activated successfully'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error verifying payment:', err);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    } finally {
      client.release();
    }
  });

  // Cancel subscription
  router.post('/cancel/:subscriptionId', async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { userId } = req.body;
      
      const result = await pool.query(`
        UPDATE user_subscriptions 
        SET status = 'cancelled', auto_renew = FALSE, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [subscriptionId, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription'
      });
    }
  });

  // Get subscription history
  router.get('/history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const result = await pool.query(`
        SELECT st.*, sp.name as plan_name
        FROM subscription_transactions st
        LEFT JOIN user_subscriptions us ON st.subscription_id = us.id
        LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE st.user_id = $1
        ORDER BY st.created_at DESC
      `, [userId]);
      
      res.json({
        success: true,
        transactions: result.rows
      });
    } catch (err) {
      console.error('Error fetching subscription history:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch history'
      });
    }
  });

  return router;
};
