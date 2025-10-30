-- Premium Subscription System Schema

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('company', 'freelancer')),
    duration_days INTEGER NOT NULL,
    price_inr DECIMAL(10,2) NOT NULL,
    price_vcreds INTEGER NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
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

-- Subscription transactions table
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

-- Create trigger for updating timestamps
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, user_type, duration_days, price_inr, price_vcreds, features) VALUES
-- Company Plans
('Company Premium Monthly', 'company', 30, 999.00, 100, 
 '{"priority_listings": true, "unlimited_jobs": true, "advanced_analytics": true, "featured_badge": true, "priority_support": true, "advanced_search": true, "project_insights": true}'::jsonb),
 
('Company Premium Quarterly', 'company', 90, 2499.00, 250, 
 '{"priority_listings": true, "unlimited_jobs": true, "advanced_analytics": true, "featured_badge": true, "priority_support": true, "advanced_search": true, "project_insights": true, "discount": "17%"}'::jsonb),
 
('Company Premium Yearly', 'company', 365, 8999.00, 900, 
 '{"priority_listings": true, "unlimited_jobs": true, "advanced_analytics": true, "featured_badge": true, "priority_support": true, "advanced_search": true, "project_insights": true, "discount": "25%"}'::jsonb),

-- Freelancer Plans
('Freelancer Premium Monthly', 'freelancer', 30, 499.00, 50, 
 '{"featured_profile": true, "priority_search": true, "reduced_fees": true, "fee_percentage": 5, "advanced_analytics": true, "instant_alerts": true, "unlimited_applications": true, "premium_courses": true}'::jsonb),
 
('Freelancer Premium Quarterly', 'freelancer', 90, 1299.00, 130, 
 '{"featured_profile": true, "priority_search": true, "reduced_fees": true, "fee_percentage": 5, "advanced_analytics": true, "instant_alerts": true, "unlimited_applications": true, "premium_courses": true, "discount": "13%"}'::jsonb),
 
('Freelancer Premium Yearly', 'freelancer', 365, 4499.00, 450, 
 '{"featured_profile": true, "priority_search": true, "reduced_fees": true, "fee_percentage": 5, "advanced_analytics": true, "instant_alerts": true, "unlimited_applications": true, "premium_courses": true, "discount": "25%"}'::jsonb);

-- Note: Functions should be created separately if needed

-- View for active premium users
CREATE OR REPLACE VIEW premium_users AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.user_type,
    us.status as subscription_status,
    us.start_date,
    us.end_date,
    sp.name as plan_name,
    sp.features,
    CASE 
        WHEN us.end_date > NOW() THEN TRUE 
        ELSE FALSE 
    END as is_premium_active
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active' AND us.end_date > NOW();
