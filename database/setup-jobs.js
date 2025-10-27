const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

async function setupJobsTables() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Setting up jobs and applications tables...');
    
    // Read and execute the jobs schema
    const schema = fs.readFileSync(path.join(__dirname, 'jobs-schema.sql'), 'utf8');
    await client.query(schema);
    
    console.log('✅ Jobs and applications tables created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('jobs', 'job_applications')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    console.log('\n✅ Jobs system setup complete!');
    
  } catch (err) {
    console.error('❌ Error setting up jobs tables:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setupJobsTables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
