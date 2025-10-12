const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '..')));

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users in database: ${result.rows[0].count}`);
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Basic routes
app.get('/', (req, res) => {
  console.log('📄 Serving main page');
  res.sendFile(path.join(__dirname, '../src/pages/skill-vault-website.html'));
});





app.get('/login', (req, res) => {
  console.log('🔐 Serving login page');
  res.sendFile(path.join(__dirname, '../src/pages/login.html'));
});

// Simple API test endpoint
app.get('/api/test', (req, res) => {
  console.log('🔧 API test endpoint called');
  res.json({ success: true, message: 'API is working!' });
});

// Debug endpoint to check database
app.get('/api/debug', async (req, res) => {
  try {
    console.log('🐛 Debug endpoint called');
    const client = await pool.connect();
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    
    client.release();
    
    res.json({
      success: true,
      tables: tablesResult.rows.map(row => row.table_name),
      userCount: usersResult.rows[0].count
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Clean API endpoints without SMS functionality

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server error:', error.message);
  res.status(500).json({ success: false, error: error.message });
});

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Debug server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   - Main: http://localhost:3000/');
  console.log('   - Login: http://localhost:3000/login');
  console.log('   - API Test: http://localhost:3000/api/test');
  console.log('   - Debug: http://localhost:3000/api/debug');
  
  await testConnection();
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
});