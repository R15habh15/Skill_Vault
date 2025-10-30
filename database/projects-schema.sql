-- Active Projects and Hired Freelancers Schema
-- Extends the job system with project management and freelancer tracking

-- Active projects table - stores ongoing projects from accepted applications
CREATE TABLE IF NOT EXISTS active_projects (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    application_id INTEGER REFERENCES job_applications(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT,
    budget_amount INTEGER NOT NULL,
    agreed_rate INTEGER, -- The rate agreed upon from application
    agreed_timeline VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'under_review', 'completed', 'cancelled', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    credits_held INTEGER DEFAULT 0, -- Credits held in escrow
    credits_released INTEGER DEFAULT 0, -- Credits released to freelancer
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id) -- One project per accepted application
);

-- Hired freelancers table - tracks company-freelancer relationships
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
    UNIQUE(company_id, freelancer_id) -- One record per company-freelancer pair
);

-- Project milestones table - for tracking project progress
CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES active_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    credits_amount INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project communications table - for project-related messages
CREATE TABLE IF NOT EXISTS project_communications (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES active_projects(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_projects_company_id ON active_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_active_projects_freelancer_id ON active_projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_active_projects_job_id ON active_projects(job_id);
CREATE INDEX IF NOT EXISTS idx_active_projects_status ON active_projects(status);
CREATE INDEX IF NOT EXISTS idx_hired_freelancers_company_id ON hired_freelancers(company_id);
CREATE INDEX IF NOT EXISTS idx_hired_freelancers_freelancer_id ON hired_freelancers(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_communications_project_id ON project_communications(project_id);

-- Triggers for updating timestamps
CREATE TRIGGER update_active_projects_updated_at BEFORE UPDATE ON active_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hired_freelancers_updated_at BEFORE UPDATE ON hired_freelancers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
