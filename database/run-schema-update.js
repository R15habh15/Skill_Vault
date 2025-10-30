const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function runUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating schema for work submission...\n');
    
    const schemaPath = path.join(__dirname, 'update-schema-for-work-submission.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    
    console.log('\n✅ Schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runUpdate();
