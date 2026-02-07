-- This migration removes all session data as sessions are no longer used
-- Logs are now created automatically and farmers are assigned by admin post-facto

-- Delete all device sessions
DELETE FROM "DeviceSession";

-- Optional: If you want to drop the DeviceSession table entirely, uncomment:
-- DROP TABLE "DeviceSession";

-- Note: We keep the table structure for now in case historical data analysis is needed
-- The table will simply not be used going forward
