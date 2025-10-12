const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// First connect to default postgres database
const defaultPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Database configuration for skillvault database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function createDatabase() {
  const client = await defaultPool.connect();
  try {
    console.log('🔄 Creating skillvault database...');
    
    // Check if database already exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'skillvault'"
    );
    
    if (result.rows.length === 0) {
      // Create the database
      await client.query('CREATE DATABASE skillvault');
      console.log('🎉 Database "skillvault" created successfully!');
    } else {
      console.log('✅ Database "skillvault" already exists!');
    }
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  } finally {
    client.release();
    await defaultPool.end();
  }
}

async function setupDatabase() {
  try {
    await createDatabase();
  } catch (error) {
    console.error('Database creation failed:', error);
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up VCreds database schema...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'vcreds-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          // Some statements might fail if they already exist, that's okay
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} - Object already exists, skipping`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    console.log('🎉 Database setup completed!');
    
    // Test the setup by checking if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_credits', 'credit_orders', 'credit_transactions', 'withdrawal_requests')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Insert sample data for testing
    console.log('\n🔄 Inserting sample data...');
    
    // Check if users already exist
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      // Insert sample users
      await client.query(`
        INSERT INTO users (username, email, password_hash, user_type) VALUES
        ('testcompany', 'company@test.com', '$2b$10$samplehash1', 'company'),
        ('testfreelancer', 'freelancer@test.com', '$2b$10$samplehash2', 'freelancer')
      `);
      
      // Insert sample credits for testing
      await client.query(`
        INSERT INTO user_credits (user_id, credits, transaction_type, description) VALUES
        (1, 500, 'initial', 'Initial test credits for company'),
        (2, 100, 'initial', 'Initial test credits for freelancer')
      `);
      
      console.log('✅ Sample data inserted successfully');
      console.log('   - Test Company: company@test.com (500 VCreds)');
      console.log('   - Test Freelancer: freelancer@test.com (100 VCreds)');
    } else {
      console.log('⚠️  Users already exist, skipping sample data insertion');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});