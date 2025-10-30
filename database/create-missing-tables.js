const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skillvault',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating missing tables...\n');
    
    // Create hired_freelancers table
    console.log('Creating hired_freelancers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS hired_freelancers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        first_hired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_projects INTEGER DEFAULT 1,
        total_credits_paid INTEGER DEFAULT 0,
        active_projects INTEGER DEFAULT 1,
        completed_projects INTEGER DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
        notes TEXT,
        last_project_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, freelancer_id)
      )
    `);
    console.log('✅ hired_freelancers table created\n');
    
    // Create project_communications table
    console.log('Creating project_communications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_communications (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES active_projects(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        attachment_url TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ project_communications table created\n');
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_hired_freelancers_company_id ON hired_freelancers(company_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_hired_freelancers_freelancer_id ON hired_freelancers(freelancer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_communications_project_id ON project_communications(project_id)');
    console.log('✅ Indexes created\n');
    
    // Create triggers
    console.log('Creating triggers...');
    await client.query(`
      CREATE TRIGGER update_hired_freelancers_updated_at BEFORE UPDATE ON hired_freelancers 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('⚠️  Trigger already exists, skipping');
      } else {
        throw err;
      }
    });
    console.log('✅ Triggers created\n');
    
    // Verify all tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('active_projects', 'hired_freelancers', 'project_milestones', 'project_communications')
      ORDER BY table_name
    `);
    
    console.log('📊 All project-related tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    if (result.rows.length === 4) {
      console.log('\n✅ All tables created successfully!');
    } else {
      console.log(`\n⚠️  Expected 4 tables, found ${result.rows.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingTables();
