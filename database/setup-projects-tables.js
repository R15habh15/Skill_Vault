const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function setupProjectsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up Active Projects and Hired Freelancers tables...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'projects-schema.sql');
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
    
    console.log('🎉 Projects tables setup completed!');
    
    // Test the setup by checking if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('active_projects', 'hired_freelancers', 'project_milestones', 'project_communications')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    if (result.rows.length === 4) {
      console.log('\n✅ All project-related tables created successfully!');
    } else {
      console.log('\n⚠️  Some tables may not have been created. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Projects tables setup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupProjectsTables().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
