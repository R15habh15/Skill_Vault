-- Work Submission and Escrow System Schema

-- Work submissions table - stores submitted work files and revisions
CREATE TABLE IF NOT EXISTS work_submissions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES active_projects(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_number INTEGER DEFAULT 1,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'needs_revision')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work reviews table - stores company feedback on submissions
CREATE TABLE IF NOT EXISTS work_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES work_submissions(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES active_projects(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('approved', 'needs_revision')),
    revision_notes TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escrow transactions table - manages credit holds and releases
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES active_projects(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Past projects table - stores completed projects
CREATE TABLE IF NOT EXISTS past_projects (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES active_projects(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget_amount INTEGER NOT NULL,
    final_amount INTEGER NOT NULL,
    submission_count INTEGER DEFAULT 1,
    revision_count INTEGER DEFAULT 0,
    final_file_url TEXT,
    final_file_name VARCHAR(255),
    company_rating DECIMAL(2,1),
    freelancer_rating DECIMAL(2,1),
    company_review TEXT,
    freelancer_review TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_submissions_project_id ON work_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_work_submissions_freelancer_id ON work_submissions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_work_submissions_status ON work_submissions(status);
CREATE INDEX IF NOT EXISTS idx_work_reviews_submission_id ON work_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_work_reviews_project_id ON work_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_project_id ON escrow_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_past_projects_company_id ON past_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_past_projects_freelancer_id ON past_projects(freelancer_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_escrow_transactions_updated_at BEFORE UPDATE ON escrow_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
