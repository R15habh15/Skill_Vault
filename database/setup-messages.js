const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432
});

async function setupMessagesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up messages table...');
    
    // Read and execute the schema file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'messages-schema.sql'),
      'utf8'
    );
    
    await client.query(schemaSQL);
    
    console.log('✅ Messages table created successfully!');
    console.log('✅ Indexes created for optimal performance');
    console.log('✅ Notifications table updated to support message type');
    
  } catch (error) {
    console.error('❌ Error setting up messages table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupMessagesTable()
  .then(() => {
    console.log('✅ Messages setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Messages setup failed:', error);
    process.exit(1);
  });
