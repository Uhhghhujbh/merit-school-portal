-- Ensure admin emails are in the admin_allowlist table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_allowlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_allowlist (email) 
VALUES 
    ('adewuyiayuba@gmail.com'),
    ('olayayemi@gmail.com')
ON CONFLICT (email) DO NOTHING;
