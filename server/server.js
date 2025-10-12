const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

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
        userType: user.user_type
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



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
