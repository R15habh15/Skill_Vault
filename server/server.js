const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
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
  const { username, email, password, userType } = req.body;

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
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING COUNT(*)',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
