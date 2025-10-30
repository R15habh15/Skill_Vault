-- Drop existing messages table if it exists (to start fresh)
DROP TABLE IF EXISTS messages CASCADE;

-- Messages table for chat system
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, timestamp DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Update notifications table to support message type if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_type_check'
    ) THEN
        ALTER TABLE notifications 
        DROP CONSTRAINT IF EXISTS notifications_type_check;
        
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('job_match', 'payment', 'project_update', 'message', 'system', 'withdrawal', 'application_status'));
    END IF;
END $$;
