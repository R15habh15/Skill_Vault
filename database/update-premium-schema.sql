-- Update existing subscription_plans table to add premium features

-- Add price_inr column if it doesn't exist
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS price_inr DECIMAL(10,2) DEFAULT 0;

-- Add price_vcreds column if it doesn't exist  
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS price_vcreds INTEGER DEFAULT 0;

-- Update existing plans or insert new premium plans
-- First, delete any existing premium plans to avoid duplicates
DELETE FROM subscription_plans WHERE name LIKE '%Premium%';

-- Insert premium plans
INSERT INTO subscription_plans (name, user_type, duration_days, price_inr, price_vcreds, price_credits, features, benefits, is_active, display_order) VALUES
-- Company Plans
('Company Premium Monthly', 'company', 30, 999.00, 100, 100,
 '["Priority job listings", "Unlimited job postings", "Advanced analytics", "Featured badge", "Priority support", "Advanced search", "Project insights"]'::jsonb,
 'Get your jobs seen first and access powerful analytics', TRUE, 10),
 
('Company Premium Quarterly', 'company', 90, 2499.00, 250, 250,
 '["Priority job listings", "Unlimited job postings", "Advanced analytics", "Featured badge", "Priority support", "Advanced search", "Project insights", "Save 17%"]'::jsonb,
 'Best value - save 17% with quarterly billing', TRUE, 11),
 
('Company Premium Yearly', 'company', 365, 8999.00, 900, 900,
 '["Priority job listings", "Unlimited job postings", "Advanced analytics", "Featured badge", "Priority support", "Advanced search", "Project insights", "Save 25%"]'::jsonb,
 'Maximum savings - save 25% with annual billing', TRUE, 12),

-- Freelancer Plans
('Freelancer Premium Monthly', 'freelancer', 30, 499.00, 50, 50,
 '["Featured profile", "Priority search", "Reduced fees (5%)", "Advanced analytics", "Instant alerts", "Unlimited applications", "Premium courses"]'::jsonb,
 'Stand out and earn more with premium features', TRUE, 20),
 
('Freelancer Premium Quarterly', 'freelancer', 90, 1299.00, 130, 130,
 '["Featured profile", "Priority search", "Reduced fees (5%)", "Advanced analytics", "Instant alerts", "Unlimited applications", "Premium courses", "Save 13%"]'::jsonb,
 'Great value - save 13% with quarterly billing', TRUE, 21),
 
('Freelancer Premium Yearly', 'freelancer', 365, 4499.00, 450, 450,
 '["Featured profile", "Priority search", "Reduced fees (5%)", "Advanced analytics", "Instant alerts", "Unlimited applications", "Premium courses", "Save 25%"]'::jsonb,
 'Best deal - save 25% with annual billing', TRUE, 22);

-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('razorpay', 'vcreds')),
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    amount_paid DECIMAL(10,2),
    vcreds_paid INTEGER,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'refund')),
    payment_method VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2),
    vcreds_amount INTEGER,
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_user_type ON subscription_plans(user_type);

-- Create trigger for updating timestamps if function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
        CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
        CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
