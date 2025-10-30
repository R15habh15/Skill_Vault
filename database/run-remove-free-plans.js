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

async function removeFreePlans() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Removing free/0 INR subscription plans...\n');
    
    // First, show what will be deleted
    const beforeResult = await client.query(`
      SELECT id, name, user_type, price_inr 
      FROM subscription_plans 
      WHERE price_inr = 0 OR price_inr IS NULL OR price_credits = 0 OR name NOT LIKE '%Premium%'
      ORDER BY user_type, name
    `);
    
    if (beforeResult.rows.length > 0) {
      console.log('📋 Plans to be removed:');
      beforeResult.rows.forEach(plan => {
        console.log(`  ❌ ${plan.name} (${plan.user_type}) - ₹${plan.price_inr || 0}`);
      });
      console.log('');
    }
    
    // Execute the deletion
    const sqlPath = path.join(__dirname, 'remove-free-plans.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Free plans removed successfully!\n');
    
    // Show remaining plans
    const afterResult = await client.query(`
      SELECT id, name, user_type, price_inr, price_vcreds, duration_days 
      FROM subscription_plans 
      ORDER BY user_type, duration_days
    `);
    
    console.log('📊 Remaining Premium Plans:');
    afterResult.rows.forEach(plan => {
      console.log(`  ✓ ${plan.name} - ₹${plan.price_inr} (${plan.duration_days} days)`);
    });
    
    console.log(`\n🎉 Total premium plans: ${afterResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

removeFreePlans();
