-- ======================================================
-- SAFE MIGRATION: ADD MISSING TX_REF COLUMN
-- ======================================================
-- This script safely adds the tx_ref column to the payments table 
-- WITHOUT dropping the table or losing any data.

-- 1. Add the column if it doesn't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tx_ref VARCHAR(255);

-- 2. If you have existing data, we might need to populate tx_ref 
-- with a temporary unique value so we can apply the UNIQUE constraint.
-- This line generates a random reference for any existing rows that have NULL tx_ref.
UPDATE payments SET tx_ref = 'OLD_PAYMENT_' || id::text WHERE tx_ref IS NULL;

-- 3. Now apply the UNIQUE and NOT NULL constraints safely
ALTER TABLE payments ALTER COLUMN tx_ref SET NOT NULL;
ALTER TABLE payments ADD CONSTRAINT payments_tx_ref_key UNIQUE (tx_ref);

-- 4. Create the index for speed
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(tx_ref);

-- SUCCESS MESSAGE
SELECT 'Migration successful: tx_ref column added safely!' as status;
