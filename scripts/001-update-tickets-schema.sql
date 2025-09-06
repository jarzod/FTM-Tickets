-- Add missing columns to tickets table for full application support
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS row text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS value integer DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignment_type text DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status text DEFAULT 'tentative';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS price integer DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS parking boolean DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_playoff boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to people table  
ALTER TABLE people ADD COLUMN IF NOT EXISTS company text DEFAULT '';
ALTER TABLE people ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
