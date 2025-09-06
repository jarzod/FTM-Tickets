-- Create assignment_history table to track ticket assignments
CREATE TABLE IF NOT EXISTS assignment_history (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  person_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  event_id text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  date text NOT NULL,
  seat_type text NOT NULL,
  assignment_type text NOT NULL,
  price integer DEFAULT 0,
  confirmed boolean DEFAULT false,
  parking boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_history_person_id ON assignment_history(person_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_event_id ON assignment_history(event_id);
