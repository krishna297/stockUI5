/*
  # Update picked_stocks table and create suggestions tables

  1. Modified Tables
    - `picked_stocks`
      - `source_file` now allows NULL values

  2. New Tables
    - `suggestions` - User suggestions/feedback
    - `suggestion_replies` - Replies to suggestions
    - `chat_messages` - Chat messages

  3. Security
    - Enable RLS on all tables
    - Allow all users to read/write data
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'picked_stocks' AND column_name = 'source_file'
  ) THEN
    ALTER TABLE picked_stocks ALTER COLUMN source_file DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suggestion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to read suggestions"
  ON suggestions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow all users to insert suggestions"
  ON suggestions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow all users to read suggestion_replies"
  ON suggestion_replies FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow all users to insert suggestion_replies"
  ON suggestion_replies FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow all users to read chat_messages"
  ON chat_messages FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow all users to insert chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
