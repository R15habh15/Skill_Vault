const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('Checking subscription_plans table structure...\n');
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in subscription_plans:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Check if there are any plans
    const plansResult = await client.query('SELECT * FROM subscription_plans LIMIT 1');
    console.log(`\nNumber of plans: ${plansResult.rows.length}`);
    if (plansResult.rows.length > 0) {
      console.log('Sample plan:', plansResult.rows[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
