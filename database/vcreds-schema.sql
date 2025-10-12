-- VCreds System Database Schema
-- Run this SQL script to create the necessary tables for the VCreds system

-- Create extension for UUID generation (if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'freelancer' CHECK (user_type IN ('freelancer', 'company', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User credits table - stores current credit balance for each user
CREATE TABLE user_credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 0 CHECK (credits >= 0),
    transaction_type VARCHAR(50) DEFAULT 'initial',
    transaction_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Credit orders table - stores Razorpay orders for credit purchases
CREATE TABLE credit_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL, -- Razorpay order ID
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    credits INTEGER NOT NULL CHECK (credits > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_id VARCHAR(100), -- Razorpay payment ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit transactions table - logs all credit movements
CREATE TABLE credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'received', 'sent', 'withdrawal', 'refund')),
    amount DECIMAL(10,2), -- INR amount (for purchases/withdrawals)
    credits INTEGER NOT NULL,
    description TEXT,
    project_id INTEGER, -- Reference to project/job if applicable
    payment_id VARCHAR(100), -- Razorpay payment ID or transaction reference
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawal requests table - stores freelancer withdrawal requests
CREATE TABLE withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL CHECK (credits >= 10), -- Minimum 10 VCreds
    gross_amount DECIMAL(10,2) NOT NULL, -- Credits * exchange rate
    processing_fee DECIMAL(10,2) NOT NULL, -- 2% processing fee
    net_amount DECIMAL(10,2) NOT NULL, -- Amount after fee
    method VARCHAR(20) NOT NULL CHECK (method IN ('bank', 'upi', 'paypal', 'paytm')),
    account_details JSONB NOT NULL, -- Store account details as JSON
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    transaction_id VARCHAR(100), -- Bank/UPI transaction ID
    notes TEXT, -- Admin notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Credit transfers table - logs direct transfers between users
CREATE TABLE credit_transfers (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL CHECK (credits > 0),
    description TEXT,
    project_id INTEGER, -- Reference to project/job
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_user_id != to_user_id) -- Prevent self-transfers
);

-- Exchange rates table - stores historical exchange rates
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('purchase', 'withdrawal')),
    rate DECIMAL(10,2) NOT NULL, -- Rate in INR per VCred
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (basic structure for reference)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    budget_credits INTEGER,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_orders_user_id ON credit_orders(user_id);
CREATE INDEX idx_credit_orders_status ON credit_orders(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_credit_transfers_from_user ON credit_transfers(from_user_id);
CREATE INDEX idx_credit_transfers_to_user ON credit_transfers(to_user_id);

-- Insert default exchange rates
INSERT INTO exchange_rates (rate_type, rate) VALUES 
('purchase', 10.00), -- 1 VCred = ₹10 for companies purchasing
('withdrawal', 9.00); -- 1 VCred = ₹9 for freelancers withdrawing (10% platform fee)

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_orders_updated_at BEFORE UPDATE ON credit_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for user credit summary
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.user_type,
    COALESCE(uc.credits, 0) as current_credits,
    COALESCE(purchase_stats.total_purchased, 0) as total_credits_purchased,
    COALESCE(purchase_stats.total_spent, 0) as total_amount_spent,
    COALESCE(withdrawal_stats.total_withdrawn, 0) as total_credits_withdrawn,
    COALESCE(withdrawal_stats.total_received, 0) as total_amount_received
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
LEFT JOIN (
    SELECT 
        user_id,
        SUM(credits) as total_purchased,
        SUM(amount) as total_spent
    FROM credit_transactions 
    WHERE type = 'purchase' AND status = 'completed'
    GROUP BY user_id
) purchase_stats ON u.id = purchase_stats.user_id
LEFT JOIN (
    SELECT 
        user_id,
        SUM(credits) as total_withdrawn,
        SUM(net_amount) as total_received
    FROM withdrawal_requests 
    WHERE status = 'completed'
    GROUP BY user_id
) withdrawal_stats ON u.id = withdrawal_stats.user_id;

-- Create a function to transfer credits between users
CREATE OR REPLACE FUNCTION transfer_credits(
    p_from_user_id INTEGER,
    p_to_user_id INTEGER,
    p_credits INTEGER,
    p_description TEXT DEFAULT NULL,
    p_project_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $
DECLARE
    v_from_balance INTEGER;
BEGIN
    -- Check if users exist and are different
    IF p_from_user_id = p_to_user_id THEN
        RAISE EXCEPTION 'Cannot transfer credits to the same user';
    END IF;
    
    -- Check sender's balance
    SELECT COALESCE(credits, 0) INTO v_from_balance 
    FROM user_credits 
    WHERE user_id = p_from_user_id;
    
    IF v_from_balance < p_credits THEN
        RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', v_from_balance, p_credits;
    END IF;
    
    -- Start transaction
    BEGIN
        -- Deduct from sender
        UPDATE user_credits 
        SET credits = credits - p_credits, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_from_user_id;
        
        -- Add to receiver (insert or update)
        INSERT INTO user_credits (user_id, credits, transaction_type, description)
        VALUES (p_to_user_id, p_credits, 'received', p_description)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            credits = user_credits.credits + p_credits,
            updated_at = CURRENT_TIMESTAMP;
        
        -- Log sender transaction
        INSERT INTO credit_transactions (user_id, type, credits, description, project_id)
        VALUES (p_from_user_id, 'sent', p_credits, p_description, p_project_id);
        
        -- Log receiver transaction
        INSERT INTO credit_transactions (user_id, type, credits, description, project_id)
        VALUES (p_to_user_id, 'received', p_credits, p_description, p_project_id);
        
        -- Log transfer
        INSERT INTO credit_transfers (from_user_id, to_user_id, credits, description, project_id)
        VALUES (p_from_user_id, p_to_user_id, p_credits, p_description, p_project_id);
        
        RETURN TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillvault_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillvault_user;