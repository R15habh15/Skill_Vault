const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import APIs
const workSubmissionAPI = require('./api/work-submission');
const premiumSubscriptionAPI = require('./api/premium-subscription');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432
});

// Test database connection
pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to PostgreSQL database');
    // Test query to verify database is responding
    return client.query('SELECT NOW()')
      .then(res => {
        console.log('✅ Database query test successful, server time:', res.rows[0].now);
        client.release();
      })
      .catch(err => {
        console.error('❌ Database query test failed:', err);
        client.release();
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('❌ Error connecting to the database:', err);
    process.exit(1);
  });

// Add error handler for pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/skill-vault-website.html'));
});

// Serve other static pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/userdashboard.html'));
});

app.get('/company-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/companydashboard.html'));
});



app.post('/api/register', async (req, res) => {
  const { username, email, password, userType, companyProfile } = req.body;

  // Log registration attempt without sensitive data
  console.log('📝 Registration request received:', {
    username,
    email,
    userType
  });

  // Add detailed debugging (without sensitive data)
  console.log('🔵 Processing registration:', {
    username,
    email,
    userType,
    timestamp: new Date().toISOString()
  });
  // Input validation
  if (!username || !email || !password || !userType) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields'
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }

  // Username length check
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({
      success: false,
      message: 'Username must be between 3 and 30 characters'
    });
  }

  // Password strength check
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Case-insensitive email check
  const existingUser = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (existingUser.rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Username uniqueness check
  const existingUsername = await pool.query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );

  if (existingUsername.rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Username already taken'
    });
  }

  // Begin a transaction to ensure email and username checks are atomic
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Double-check email and username uniqueness within the transaction
    console.log('Checking for duplicate email...');
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    console.log('Email check result:', emailCheck.rows);

    if (emailCheck.rows.length > 0) {
      console.log('Email already exists');
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    console.log('Checking for duplicate username...');
    const usernameCheck = await client.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    console.log('Username check result:', usernameCheck.rows);

    if (usernameCheck.rows.length > 0) {
      console.log('Username already exists');
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Proceed with registration if all checks pass
    console.log('Creating new user account for:', email);
    const result = await client.query(
      'INSERT INTO users(username, email, password_hash, user_type) VALUES($1, $2, $3, $4) RETURNING id, username, email, user_type',
      [username, email, hashedPassword, userType]
    );

    const userId = result.rows[0].id;

    // If company registration, save company profile data
    if (userType === 'company' && companyProfile) {
      console.log('Saving company profile data for user:', userId);
      await client.query(
        `INSERT INTO company_profiles 
        (user_id, company_name, registration_number, business_email, business_phone, business_address, representative_name, representative_position) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          companyProfile.companyName,
          companyProfile.registrationNumber,
          companyProfile.businessEmail,
          companyProfile.businessPhone,
          companyProfile.businessAddress,
          companyProfile.representativeName,
          companyProfile.representativePosition
        ]
      );
      console.log('✅ Company profile saved successfully');
    }

    // Log success without exposing user data
    console.log('✅ User account created successfully for:', email);

    await client.query('COMMIT');

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);

    // Handle unique constraint violations explicitly
    if (err.code === '23505') { // PostgreSQL unique violation code
      if (err.constraint === 'users_email_key') {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      } else if (err.constraint === 'users_username_key') {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });

  } finally {
    client.release();
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Log login attempt without exposing full email
  const maskedEmail = email.replace(/(?<=.{3}).(?=.*@)/g, '*');
  console.log('🔐 Login attempt received:', maskedEmail);

  try {


    // Regular login with email and password
    console.log('Querying database for user with email:', email);
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    console.log('Query result:', result.rows.length > 0 ? 'User found' : 'No user found');

    if (result.rows.length === 0) {
      console.log('No account found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Login successful
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        user_type: user.user_type
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Settings API endpoints

// Get user settings
app.get('/api/settings/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('📋 Fetching settings for user:', userId);

    const result = await pool.query(
      'SELECT settings FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        notifications: {
          emailJobMatches: true,
          paymentNotifications: true
        },
        preferences: {
          language: 'en',
          currency: 'INR'
        }
      };

      res.json({
        success: true,
        settings: defaultSettings
      });
    } else {
      res.json({
        success: true,
        settings: result.rows[0].settings
      });
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Update user settings
app.post('/api/settings/:userId', async (req, res) => {
  const { userId } = req.params;
  const { settings } = req.body;

  try {
    console.log('💾 Updating settings for user:', userId);

    // Check if settings exist
    const existingSettings = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (existingSettings.rows.length === 0) {
      // Insert new settings
      await pool.query(
        'INSERT INTO user_settings (user_id, settings) VALUES ($1, $2)',
        [userId, JSON.stringify(settings)]
      );
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE user_settings SET settings = $1, updated_at = NOW() WHERE user_id = $2',
        [JSON.stringify(settings), userId]
      );
    }

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Change password
app.post('/api/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    console.log('🔑 Password change request for user:', userId);

    // Get current user data
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Test endpoint to create a company user (for testing purposes)
app.post('/api/create-test-company', async (req, res) => {
  try {
    const testCompany = {
      username: 'TestCompany',
      email: 'company@test.com',
      password: 'password123',
      userType: 'company'
    };

    // Check if test company already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [testCompany.email]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Test company already exists',
        credentials: {
          email: testCompany.email,
          password: testCompany.password
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testCompany.password, 10);

    // Create test company
    const result = await pool.query(
      'INSERT INTO users(username, email, password_hash, user_type) VALUES($1, $2, $3, $4) RETURNING id, username, email, user_type',
      [testCompany.username, testCompany.email, hashedPassword, testCompany.userType]
    );

    res.json({
      success: true,
      message: 'Test company created successfully',
      credentials: {
        email: testCompany.email,
        password: testCompany.password
      },
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating test company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test company'
    });
  }
});

// Razorpay integration
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order for company credit purchase
app.post('/api/company/create-order', async (req, res) => {
  try {
    const { amount, credits, userId } = req.body;

    console.log('🏢 Creating company credit order:', { amount, credits, userId });

    // Validate input
    if (!amount || !credits || !userId || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order details'
      });
    }

    // Create order with Razorpay
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `company_credits_${Date.now()}`,
      notes: {
        userId: userId,
        credits: credits,
        type: 'company_credits'
      }
    };

    const order = await razorpay.orders.create(options);

    // Store order in database
    await pool.query(
      'INSERT INTO credit_orders (order_id, user_id, amount, credits, status) VALUES ($1, $2, $3, $4, $5)',
      [order.id, userId, amount, credits, 'pending']
    );

    console.log('✅ Company order created:', order.id);

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Error creating company order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Verify company credit payment
app.post('/api/company/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId
    } = req.body;

    console.log('🏢 Verifying company payment:', { razorpay_order_id, razorpay_payment_id, userId });

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('❌ Invalid signature');
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

    // Update order status
    await pool.query(
      'UPDATE credit_orders SET status = $1, payment_id = $2, updated_at = NOW() WHERE order_id = $3',
      ['completed', razorpay_payment_id, razorpay_order_id]
    );

    // Add credits to user account
    await pool.query(
      'INSERT INTO user_credits (user_id, credits, transaction_type, transaction_id, description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO UPDATE SET credits = user_credits.credits + $2, updated_at = NOW()',
      [userId, order.credits, 'purchase', razorpay_payment_id, `VCreds Purchase - ${order.credits} Credits`]
    );

    // Log transaction
    await pool.query(
      'INSERT INTO credit_transactions (user_id, type, amount, credits, description, payment_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, 'purchase', order.amount, order.credits, `VCreds Purchase - ${order.credits} Credits`, razorpay_payment_id, 'completed']
    );

    console.log('✅ Company payment verified and credits added');

    res.json({
      success: true,
      message: 'Payment verified and credits added',
      credits: order.credits
    });

  } catch (error) {
    console.error('❌ Error verifying company payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Download user data
app.get('/api/download-data/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('📥 Data download request for user:', userId);

    // Get user data
    const userResult = await pool.query(
      'SELECT id, username, email, user_type, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user settings
    const settingsResult = await pool.query(
      'SELECT settings FROM user_settings WHERE user_id = $1',
      [userId]
    );

    const userData = {
      user: userResult.rows[0],
      settings: settingsResult.rows.length > 0 ? settingsResult.rows[0].settings : null,
      exportDate: new Date().toISOString(),
      exportedBy: 'Skill Vault Dashboard'
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (err) {
    console.error('Error downloading user data:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to download user data'
    });
  }
});

// Delete user account
app.delete('/api/delete-account/:userId', async (req, res) => {
  const { userId } = req.params;
  const { confirmPassword } = req.body;

  try {
    console.log('🗑️ Account deletion request for user:', userId);

    // Get user data for password verification
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(confirmPassword, userResult.rows[0].password_hash);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password verification failed'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete user settings
      await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);

      // Delete user account
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

// Notifications API endpoints

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  const { limit = 20, offset = 0, unreadOnly = false } = req.query;

  try {
    console.log('📬 Fetching notifications for user:', userId);

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    let params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Create notification
app.post('/api/notifications', async (req, res) => {
  const { userId, type, title, message, data = {}, priority = 'normal', expiresAt } = req.body;

  try {
    console.log('📨 Creating notification for user:', userId);

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, priority, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, type, title, message, JSON.stringify(data), priority, expiresAt]
    );

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;

  try {
    console.log('✅ Marking notification as read:', notificationId);

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
app.patch('/api/notifications/:userId/read-all', async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('✅ Marking all notifications as read for user:', userId);

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING id',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', async (req, res) => {
  const { notificationId } = req.params;

  try {
    console.log('🗑️ Deleting notification:', notificationId);

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 RETURNING *',
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Helper function to create notifications (for internal use)
async function createNotification(userId, type, title, message, data = {}, priority = 'normal') {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, priority) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, title, message, JSON.stringify(data), priority]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

// ==================== JOB POSTING & BROWSING API ====================

// Post a new job (Company)
app.post('/api/jobs/post', async (req, res) => {
  try {
    const { companyId, title, description, category, duration, budgetType, budgetAmount, requiredSkills, experienceLevel } = req.body;

    if (!companyId || !title || !description || !category || !duration || !budgetType || !budgetAmount || !experienceLevel) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, description, category, duration, budget_type, budget_amount, required_skills, experience_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [companyId, title, description, category, duration, budgetType, budgetAmount, requiredSkills, experienceLevel]
    );

    res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    console.error('Error posting job:', err);
    res.status(500).json({ success: false, message: 'Failed to post job' });
  }
});

// Get all active jobs (Freelancer)
app.get('/api/jobs/browse', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = `
      SELECT j.*, u.username as company_name, u.email as company_email
      FROM jobs j
      JOIN users u ON j.company_id = u.id
      WHERE j.status = 'active'
    `;
    const params = [];

    if (category && category !== 'All Categories') {
      params.push(category);
      query += ` AND j.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`;
    }

    query += ' ORDER BY j.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, jobs: result.rows });
  } catch (err) {
    console.error('Error browsing jobs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// Get company's posted jobs
app.get('/api/jobs/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status } = req.query;

    let query = 'SELECT * FROM jobs WHERE company_id = $1';
    const params = [companyId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, jobs: result.rows });
  } catch (err) {
    console.error('Error fetching company jobs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// Apply to a job (Freelancer)
app.post('/api/jobs/apply', async (req, res) => {
  try {
    const { jobId, freelancerId, coverLetter, proposedRate, estimatedDuration } = req.body;

    if (!jobId || !freelancerId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO job_applications (job_id, freelancer_id, cover_letter, proposed_rate, estimated_duration)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [jobId, freelancerId, coverLetter, proposedRate, estimatedDuration]
    );

    res.json({ success: true, application: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ success: false, message: 'You have already applied to this job' });
    }
    console.error('Error applying to job:', err);
    res.status(500).json({ success: false, message: 'Failed to apply to job' });
  }
});

// Get applications for a job (Company)
app.get('/api/jobs/:jobId/applications', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT ja.*, u.username as freelancer_name, u.email as freelancer_email
      FROM job_applications ja
      JOIN users u ON ja.freelancer_id = u.id
      WHERE ja.job_id = $1
    `;
    const params = [jobId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND ja.status = $${params.length}`;
    }

    query += ' ORDER BY ja.applied_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, applications: result.rows });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

// Get freelancer's applications
app.get('/api/jobs/applications/freelancer/:freelancerId', async (req, res) => {
  try {
    const { freelancerId } = req.params;

    const result = await pool.query(
      `SELECT ja.*, j.title as job_title, j.description as job_description, 
              j.budget_amount, j.budget_type, u.username as company_name
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       JOIN users u ON j.company_id = u.id
       WHERE ja.freelancer_id = $1
       ORDER BY ja.applied_at DESC`,
      [freelancerId]
    );

    res.json({ success: true, applications: result.rows });
  } catch (err) {
    console.error('Error fetching freelancer applications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

// Update application status (Company) - Enhanced with auto-rejection and project creation
app.put('/api/jobs/applications/:applicationId/status', async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  if (!['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get application details
    const appResult = await client.query(
      `SELECT ja.*, j.title as job_title, j.company_id, j.budget_amount, j.status as job_status, j.description,
              u.username as freelancer_name, u.email as freelancer_email,
              c.username as company_name
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       JOIN users u ON ja.freelancer_id = u.id
       JOIN users c ON j.company_id = c.id
       WHERE ja.id = $1`,
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appResult.rows[0];

    // Handle ACCEPT status - special workflow
    if (status === 'accepted') {
      // Check if job is still active
      if (application.job_status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'This job is no longer active'
        });
      }

      // Update this application to accepted
      await client.query(
        'UPDATE job_applications SET status = $1, updated_at = NOW() WHERE id = $2',
        ['accepted', applicationId]
      );

      // Auto-reject all other applications for this job
      await client.query(
        `UPDATE job_applications 
         SET status = 'rejected', updated_at = NOW() 
         WHERE job_id = $1 AND id != $2 AND status NOT IN ('accepted', 'rejected')`,
        [application.job_id, applicationId]
      );

      // Close the job (no more applications accepted)
      await client.query(
        'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2',
        ['closed', application.job_id]
      );

      // Create active project
      const projectResult = await client.query(
        `INSERT INTO active_projects 
         (job_id, application_id, company_id, freelancer_id, title, 
          description, budget_amount, agreed_rate, agreed_timeline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
         RETURNING *`,
        [
          application.job_id,
          applicationId,
          application.company_id,
          application.freelancer_id,
          application.job_title,
          application.description || 'Project from job application',
          application.budget_amount,
          application.proposed_rate || application.budget_amount,
          application.proposed_timeline,
        ]
      );

      const project = projectResult.rows[0];

      // Add or update hired freelancer record
      await client.query(
        `INSERT INTO hired_freelancers 
         (company_id, freelancer_id, total_projects, active_projects, total_credits_paid)
         VALUES ($1, $2, 1, 1, 0)
         ON CONFLICT (company_id, freelancer_id) 
         DO UPDATE SET 
           total_projects = hired_freelancers.total_projects + 1,
           active_projects = hired_freelancers.active_projects + 1,
           last_project_date = NOW(),
           updated_at = NOW()`,
        [application.company_id, application.freelancer_id]
      );

      // Notify freelancer about acceptance
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, data, priority) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          application.freelancer_id,
          'application_status',
          'Application Accepted! 🎉',
          `Congratulations! Your application for "${application.job_title}" has been accepted by ${application.company_name}. The project is now active.`,
          JSON.stringify({ applicationId, jobId: application.job_id, projectId: project.id, status: 'accepted' }),
          'high'
        ]
      );

      // Notify company about project creation
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, data, priority) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          application.company_id,
          'project_update',
          'New Project Started',
          `Project "${application.job_title}" with ${application.freelancer_name} has been created and is now active.`,
          JSON.stringify({ applicationId, jobId: application.job_id, projectId: project.id }),
          'high'
        ]
      );

      // Get other rejected applicants and notify them
      const rejectedApps = await client.query(
        `SELECT ja.freelancer_id, u.username 
         FROM job_applications ja
         JOIN users u ON ja.freelancer_id = u.id
         WHERE ja.job_id = $1 AND ja.id != $2 AND ja.status = 'rejected'`,
        [application.job_id, applicationId]
      );

      for (const rejectedApp of rejectedApps.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data, priority) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            rejectedApp.freelancer_id,
            'application_status',
            'Application Update',
            `Your application for "${application.job_title}" was not selected. The position has been filled.`,
            JSON.stringify({ applicationId, jobId: application.job_id, status: 'rejected' }),
            'normal'
          ]
        );
      }

      await client.query('COMMIT');

      console.log(`✅ Application ${applicationId} accepted, project created, ${rejectedApps.rows.length} other applications rejected`);

      return res.json({
        success: true,
        message: 'Application accepted and project created successfully',
        project: project,
        rejectedCount: rejectedApps.rows.length
      });
    }

    // Handle other status updates (reviewed, shortlisted, rejected)
    await client.query(
      'UPDATE job_applications SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, applicationId]
    );

    // Notify freelancer about status change
    let notificationTitle = 'Application Update';
    let notificationMessage = '';

    switch (status) {
      case 'reviewed':
        notificationTitle = 'Application Reviewed';
        notificationMessage = `Your application for "${application.job_title}" has been reviewed by ${application.company_name}.`;
        break;
      case 'shortlisted':
        notificationTitle = 'You\'ve Been Shortlisted! ⭐';
        notificationMessage = `Great news! You've been shortlisted for "${application.job_title}" by ${application.company_name}.`;
        break;
      case 'rejected':
        notificationTitle = 'Application Update';
        notificationMessage = `Your application for "${application.job_title}" was not selected this time.`;
        break;
    }

    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data, priority) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        application.freelancer_id,
        'application_status',
        notificationTitle,
        notificationMessage,
        JSON.stringify({ applicationId, jobId: application.job_id, status }),
        status === 'shortlisted' ? 'high' : 'normal'
      ]
    );

    await client.query('COMMIT');

    console.log(`✅ Application ${applicationId} status updated to ${status}`);

    res.json({
      success: true,
      message: `Application ${status} successfully`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating application status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  } finally {
    client.release();
  }
});

// Update job status (Company)
app.put('/api/jobs/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'closed', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, jobId]
    );

    res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    console.error('Error updating job status:', err);
    res.status(500).json({ success: false, message: 'Failed to update job status' });
  }
});

// ==================== ACTIVE PROJECTS & HIRED FREELANCERS API ====================

// Get active projects for a user (company or freelancer)
app.get('/api/jobs/projects/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { userType } = req.query; // 'company' or 'freelancer'

  try {
    let query;
    if (userType === 'company') {
      query = `
        SELECT ap.*, 
               u.username as freelancer_name, 
               u.email as freelancer_email,
               j.title as original_job_title
        FROM active_projects ap
        JOIN users u ON ap.freelancer_id = u.id
        JOIN jobs j ON ap.job_id = j.id
        WHERE ap.company_id = $1 AND ap.status != 'completed'
        ORDER BY ap.created_at DESC
      `;
    } else {
      query = `
        SELECT ap.*, 
               u.username as company_name, 
               u.email as company_email,
               j.title as original_job_title
        FROM active_projects ap
        JOIN users u ON ap.company_id = u.id
        JOIN jobs j ON ap.job_id = j.id
        WHERE ap.freelancer_id = $1 AND ap.status != 'completed'
        ORDER BY ap.created_at DESC
      `;
    }

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      projects: result.rows
    });
  } catch (err) {
    console.error('Error fetching active projects:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active projects'
    });
  }
});

// Get hired freelancers for a company
app.get('/api/jobs/hired-freelancers/:companyId', async (req, res) => {
  const { companyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT hf.*, 
              u.username as freelancer_name, 
              u.email as freelancer_email,
              u.created_at as freelancer_joined_date
       FROM hired_freelancers hf
       JOIN users u ON hf.freelancer_id = u.id
       WHERE hf.company_id = $1
       ORDER BY hf.last_project_date DESC`,
      [companyId]
    );

    res.json({
      success: true,
      freelancers: result.rows
    });
  } catch (err) {
    console.error('Error fetching hired freelancers:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hired freelancers'
    });
  }
});

// Update project status
app.put('/api/jobs/projects/:projectId/status', async (req, res) => {
  const { projectId } = req.params;
  const { status, progressPercentage } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramCount++}`);
      values.push(progressPercentage);
    }

    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
    }

    values.push(projectId);

    const result = await pool.query(
      `UPDATE active_projects 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log(`✅ Project ${projectId} updated:`, { status, progressPercentage });

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating project status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update project status'
    });
  }
});

// Mount work submission routes
app.use('/api/work-submission', workSubmissionAPI(pool));

// Mount premium subscription routes
app.use('/api/premium', premiumSubscriptionAPI(pool));

// Get Razorpay public key
app.get('/api/config/razorpay-key', (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID
  });
});

// Credits and Escrow API Routes
app.get('/api/credits/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balanceResult = await pool.query('SELECT credits FROM user_credits WHERE user_id = $1', [userId]);
    const balance = balanceResult.rows.length > 0 ? balanceResult.rows[0].credits : 0;
    const earnedResult = await pool.query('SELECT COALESCE(SUM(credits), 0) as total FROM credit_transactions WHERE user_id = $1 AND type IN ($2, $3) AND status = $4', [userId, 'earned', 'project_payment', 'completed']);
    const pendingResult = await pool.query('SELECT COALESCE(SUM(credits_amount), 0) as total FROM escrow_transactions WHERE freelancer_id = $1 AND status = $2', [userId, 'held']);
    res.json({ success: true, balance: balance, totalEarned: earnedResult.rows[0].total, pendingPayments: pendingResult.rows[0].total });
  } catch (err) {
    console.error('Error fetching credits balance:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch balance' });
  }
});

app.get('/api/credits/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 50 } = req.query;
    let query = 'SELECT * FROM credit_transactions WHERE user_id = $1';
    const params = [userId];
    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    const result = await pool.query(query, params);
    res.json({ success: true, transactions: result.rows });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// Get company profile
app.get('/api/company/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM company_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, profile: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Company profile not found' });
    }
  } catch (err) {
    console.error('Error fetching company profile:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch company profile' });
  }
});

// Update company profile
app.put('/api/company/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      companyName,
      registrationNumber,
      businessEmail,
      businessPhone,
      businessAddress,
      representativeName,
      representativePosition,
      companyDescription
    } = req.body;

    const result = await pool.query(
      `UPDATE company_profiles 
            SET company_name = $1, 
                registration_number = $2, 
                business_email = $3, 
                business_phone = $4, 
                business_address = $5, 
                representative_name = $6, 
                representative_position = $7,
                company_description = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $9
            RETURNING *`,
      [companyName, registrationNumber, businessEmail, businessPhone, businessAddress,
        representativeName, representativePosition, companyDescription, userId]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, profile: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Company profile not found' });
    }
  } catch (err) {
    console.error('Error updating company profile:', err);
    res.status(500).json({ success: false, message: 'Failed to update company profile' });
  }
});

app.post('/api/credits/withdraw', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, amount } = req.body;

    console.log('Withdrawal request:', { userId, amount });

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100 VCreds' });
    }

    await client.query('BEGIN');
    const balanceResult = await client.query('SELECT credits FROM user_credits WHERE user_id = $1', [userId]);

    if (balanceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'User account not found' });
    }

    const currentBalance = balanceResult.rows[0].credits;
    console.log('Current balance:', currentBalance, 'Requested:', amount);

    if (currentBalance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ${currentBalance} VCreds, Requested: ${amount} VCreds` });
    }
    // Deduct credits immediately
    await client.query('UPDATE user_credits SET credits = credits - $1, updated_at = NOW() WHERE user_id = $2', [amount, userId]);

    // Log transaction as completed (not pending)
    await client.query(`INSERT INTO credit_transactions (user_id, type, amount, credits, description, status) VALUES ($1, 'withdrawal', $2, $3, $4, 'completed')`, [userId, amount * 10, amount, `Withdrawal completed - ${amount} VCreds (₹${amount * 10})`]);

    // Create withdrawal record
    await client.query(`INSERT INTO withdrawal_requests (user_id, credits, gross_amount, processing_fee, net_amount, method, account_details, status, transaction_id, processed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`, [userId, amount, amount * 10, amount * 10 * 0.02, amount * 10 * 0.98, 'bank', JSON.stringify({ note: 'Auto-processed' }), 'completed', `WD-${Date.now()}`]);

    // Create notification
    await client.query(`INSERT INTO notifications (user_id, type, title, message, data, priority) VALUES ($1, 'withdrawal_requested', 'Withdrawal Completed', 'Your withdrawal of ${amount} VCreds (₹${amount * 10}) has been processed successfully', $2, 'high')`, [userId, JSON.stringify({ amount, amountInr: amount * 10, status: 'completed' })]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Withdrawal completed successfully!', newBalance: balanceResult.rows[0].credits - amount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error requesting withdrawal:', err);
    res.status(500).json({ success: false, message: 'Failed to request withdrawal' });
  } finally {
    client.release();
  }
});

app.post('/api/escrow/create', async (req, res) => {
  const client = await pool.connect();
  try {
    const { projectId, companyId, freelancerId, amount } = req.body;
    await client.query('BEGIN');
    const balanceResult = await client.query('SELECT credits FROM user_credits WHERE user_id = $1', [companyId]);
    if (balanceResult.rows.length === 0 || balanceResult.rows[0].credits < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient credits' });
    }
    await client.query('UPDATE user_credits SET credits = credits - $1, updated_at = NOW() WHERE user_id = $2', [amount, companyId]);
    const escrowResult = await client.query(`INSERT INTO escrow_transactions (project_id, company_id, freelancer_id, credits_amount, status) VALUES ($1, $2, $3, $4, 'held') RETURNING *`, [projectId, companyId, freelancerId, amount]);
    await client.query(`INSERT INTO credit_transactions (user_id, type, amount, credits, description, status) VALUES ($1, 'escrow_hold', $2, $3, $4, 'completed')`, [companyId, amount * 10, amount, `Escrow hold for project #${projectId}`]);
    await client.query('UPDATE active_projects SET credits_held = $1, updated_at = NOW() WHERE id = $2', [amount, projectId]);
    await client.query('COMMIT');
    res.json({ success: true, escrow: escrowResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating escrow:', err);
    res.status(500).json({ success: false, message: 'Failed to create escrow' });
  } finally {
    client.release();
  }
});

// ==================== CHAT SYSTEM API ====================

// Get user conversations
app.get('/api/chat/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `WITH conversation_contacts AS (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END as contact_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      )
      SELECT 
        cc.contact_id,
        u.username as contact_name,
        u.user_type as contact_type,
        (SELECT MAX(timestamp) 
         FROM messages 
         WHERE (sender_id = $1 AND receiver_id = cc.contact_id) 
            OR (sender_id = cc.contact_id AND receiver_id = $1)
        ) as last_message_time,
        (SELECT message 
         FROM messages 
         WHERE (sender_id = $1 AND receiver_id = cc.contact_id) 
            OR (sender_id = cc.contact_id AND receiver_id = $1)
         ORDER BY timestamp DESC 
         LIMIT 1
        ) as last_message,
        (SELECT COUNT(*) 
         FROM messages 
         WHERE receiver_id = $1 
           AND sender_id = cc.contact_id 
           AND is_read = FALSE
        ) as unread_count
      FROM conversation_contacts cc
      JOIN users u ON u.id = cc.contact_id
      ORDER BY last_message_time DESC`,
      [userId]
    );

    res.json({ success: true, conversations: result.rows });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// Get messages between two users
app.get('/api/chat/messages/:userId/:contactId', async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT m.*, 
        sender.username as sender_name,
        receiver.username as receiver_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY timestamp ASC
      LIMIT $3 OFFSET $4`,
      [userId, contactId, limit, offset]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
      [userId, contactId]
    );

    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send a message
app.post('/api/chat/send', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid message data' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, timestamp, is_read)
       VALUES ($1, $2, $3, NOW(), FALSE) RETURNING *`,
      [senderId, receiverId, message.trim()]
    );

    const senderInfo = await pool.query(
      'SELECT username, user_type FROM users WHERE id = $1',
      [senderId]
    );

    const messageData = {
      ...result.rows[0],
      sender_name: senderInfo.rows[0]?.username || 'Unknown',
      sender_type: senderInfo.rows[0]?.user_type || 'user'
    };

    res.json({ success: true, message: messageData });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Mark messages as read
app.put('/api/chat/mark-read/:userId/:contactId', async (req, res) => {
  try {
    const { userId, contactId } = req.params;

    await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
      [userId, contactId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

// Search users for chat
app.get('/api/chat/search-users/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { userId } = req.query;

    const result = await pool.query(
      `SELECT id, username, email, user_type 
       FROM users 
       WHERE (LOWER(username) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1))
         AND id != $2
       LIMIT 10`,
      [`%${query}%`, userId]
    );

    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

// ==================== SOCKET.IO REAL-TIME CHAT ====================

const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Online users tracking
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('💬 New socket connected:', socket.id);

  socket.on('user_connected', (userId) => {
    if (!userId) return;
    onlineUsers.set(String(userId), socket.id);
    socket.userId = String(userId);
    console.log(`✅ User ${userId} connected (socket ${socket.id})`);
    io.emit('user_online', { userId: String(userId), online: true });
  });

  socket.on('sendMessage', async (data) => {
    const { senderId, receiverId, message } = data;
    if (!senderId || !receiverId || !message?.trim()) {
      return socket.emit('error', { message: 'Invalid message payload' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, timestamp, is_read)
         VALUES ($1, $2, $3, NOW(), FALSE) RETURNING *`,
        [senderId, receiverId, message.trim()]
      );

      const senderInfo = await pool.query(
        'SELECT username, user_type FROM users WHERE id = $1',
        [senderId]
      );

      const messageData = {
        ...result.rows[0],
        sender_name: senderInfo.rows[0]?.username || 'Unknown',
        sender_type: senderInfo.rows[0]?.user_type || 'user'
      };

      // Acknowledge to sender
      socket.emit('message_sent', messageData);

      // Deliver to receiver if online
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', messageData);
      }

      console.log(`📨 ${senderId} → ${receiverId}: ${message.substring(0, 40)}`);
    } catch (err) {
      console.error('❌ Error saving message', err);
      socket.emit('error', { message: 'Failed to save message' });
    }
  });

  socket.on('typing', (data) => {
    const { senderId, receiverId, isTyping } = data;
    const receiverSocketId = onlineUsers.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: String(senderId), isTyping });
    }
  });

  socket.on('mark_read', async (data) => {
    const { userId, contactId } = data;
    try {
      await pool.query(
        `UPDATE messages SET is_read = TRUE WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
        [userId, contactId]
      );

      const senderSocketId = onlineUsers.get(String(contactId));
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', { userId: String(userId) });
      }
    } catch (err) {
      console.error('❌ Error marking read via socket', err);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(String(socket.userId));
      io.emit('user_online', { userId: String(socket.userId), online: false });
      console.log(`🔴 User ${socket.userId} disconnected`);
    } else {
      console.log('Socket disconnected:', socket.id);
    }
  });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`💬 Socket.IO chat enabled`);
});
