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

async function setupPremiumSubscription() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up premium subscription tables...\n');
    
    const schemaPath = path.join(__dirname, 'premium-subscription-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
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
    
    console.log('\n🎉 Premium subscription tables setup completed!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscription_plans', 'user_subscriptions', 'subscription_transactions')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Check if plans were inserted
    const plansResult = await client.query('SELECT COUNT(*) as count FROM subscription_plans');
    console.log(`\n📋 Subscription plans available: ${plansResult.rows[0].count}`);
    
    if (plansResult.rows[0].count > 0) {
      const plans = await client.query('SELECT name, user_type, price_inr FROM subscription_plans ORDER BY user_type, duration_days');
      console.log('\n💎 Available Plans:');
      plans.rows.forEach(plan => {
        console.log(`  • ${plan.name} - ₹${plan.price_inr} (${plan.user_type})`);
      });
    }
    
    console.log('\n✅ Premium subscription system is ready to use!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupPremiumSubscription().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
