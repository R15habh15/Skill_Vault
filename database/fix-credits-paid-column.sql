-- Make credits_paid column nullable since we're only using Razorpay now

ALTER TABLE user_subscriptions 
ALTER COLUMN credits_paid DROP NOT NULL;

-- Set default value to NULL
ALTER TABLE user_subscriptions 
ALTER COLUMN credits_paid SET DEFAULT NULL;

-- Also make vcreds_paid nullable
ALTER TABLE user_subscriptions 
ALTER COLUMN vcreds_paid DROP NOT NULL;

ALTER TABLE user_subscriptions 
ALTER COLUMN vcreds_paid SET DEFAULT NULL;
