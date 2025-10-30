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
        console.log('🔄 Updating premium subscription schema...\n');

        const schemaPath = path.join(__dirname, 'update-premium-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await client.query(schemaSql);

        console.log('✅ Schema updated successfully!\n');

        // Verify the update
        const result = await client.query(`
      SELECT name, user_type, price_inr, price_vcreds 
      FROM subscription_plans 
      WHERE name LIKE '%Premium%'
      ORDER BY user_type, duration_days
    `);

        console.log('📋 Premium Plans Available:');
        result.rows.forEach(plan => {
            console.log(`  ✓ ${plan.name} - ₹${plan.price_inr} (${plan.price_vcreds} VCreds)`);
        });

        console.log('\n🎉 Premium subscription system is ready!');

    } catch (error) {
        console.error('❌ Update failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runUpdate();
