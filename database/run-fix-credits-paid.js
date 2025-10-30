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

async function fixCreditsColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Fixing credits_paid column constraint...\n');
    
    const sqlPath = path.join(__dirname, 'fix-credits-paid-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Column constraints updated successfully!\n');
    
    // Verify the change
    const result = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions'
      AND column_name IN ('credits_paid', 'vcreds_paid')
    `);
    
    console.log('📊 Updated columns:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} - Nullable: ${row.is_nullable}, Default: ${row.column_default || 'NULL'}`);
    });
    
    console.log('\n🎉 Fix applied successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCreditsColumn();
