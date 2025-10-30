-- Company Profiles Table Schema
-- Stores additional company information collected during registration

CREATE TABLE IF NOT EXISTS company_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    business_email VARCHAR(255),
    business_phone VARCHAR(50),
    business_address TEXT,
    representative_name VARCHAR(255),
    representative_position VARCHAR(100),
    company_description TEXT,
    company_website VARCHAR(255),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_company_profiles_updated_at 
    BEFORE UPDATE ON company_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
