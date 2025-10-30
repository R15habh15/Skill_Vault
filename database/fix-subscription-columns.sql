-- Add missing columns to user_subscriptions table

-- Check and add payment_method column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD COLUMN payment_method VARCHAR(20) CHECK (payment_method IN ('razorpay', 'vcreds'));
    END IF;
END $$;

-- Check and add payment_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD COLUMN payment_id VARCHAR(100);
    END IF;
END $$;

-- Check and add order_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'order_id'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD COLUMN order_id VARCHAR(100);
    END IF;
END $$;

-- Check and add amount_paid column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD COLUMN amount_paid DECIMAL(10,2);
    END IF;
END $$;

-- Check and add vcreds_paid column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'vcreds_paid'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD COLUMN vcreds_paid INTEGER;
    END IF;
END $$;

-- Check and add auto_renew column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'auto_renew'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD COLUMN auto_renew BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
