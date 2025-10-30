-- Remove free/0 INR subscription plans (Basic, Professional, Enterprise with 0 price)

DELETE FROM subscription_plans 
WHERE price_inr = 0 OR price_inr IS NULL OR price_credits = 0;

-- Also remove any plans that are not premium plans
DELETE FROM subscription_plans 
WHERE name NOT LIKE '%Premium%';

-- Verify remaining plans
SELECT id, name, user_type, price_inr, price_vcreds, duration_days 
FROM subscription_plans 
ORDER BY user_type, duration_days;
