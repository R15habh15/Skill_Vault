const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

// Database configuration - update these values to match your PostgreSQL setup
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  console.log('🔄 Testing database connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    // Check if skillvault database exists and has tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('\n📊 Existing tables in skillvault database:');
      tablesResult.rows.forEach(row => {
        console.log(`  • ${row.table_name}`);
      });
    } else {
      console.log('\n⚠️  No tables found in skillvault database');
      console.log('   Run "node database/setup-database.js" to create the VCreds schema');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure PostgreSQL is installed and running');
      console.log('   2. Check if the service is started (services.msc)');
      console.log('   3. Verify the connection details in this script');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database "skillvault" does not exist.');
      console.log('   Create it first: CREATE DATABASE skillvault;');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed.');
      console.log('   Check your username and password in this script');
    }
    
    process.exit(1);
  }
}

testConnection();