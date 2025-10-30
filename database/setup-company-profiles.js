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

async function setupCompanyProfiles() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up company profiles table...');
    
    const schemaPath = path.join(__dirname, 'company-profiles-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    
    console.log('✅ Company profiles table created successfully!');
    
    // Verify table creation
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'company_profiles'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Company profiles table columns:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupCompanyProfiles().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
