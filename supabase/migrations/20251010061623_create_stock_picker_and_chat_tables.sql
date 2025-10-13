/*
  # Create Stock Picker, Suggestions, and Chat Tables

  1. New Tables
    - `picked_stocks`
      - `id` (uuid, primary key)
      - `ticker_name` (text)
      - `signal_type` (text)
      - `stock_price` (text)
      - `date` (text)
      - `source_file` (text, nullable)
      - `created_at` (timestamptz)
    
    - `suggestions`
      - `id` (uuid, primary key)
      - `user_name` (text)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `suggestion_replies`
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, foreign key)
      - `user_name` (text)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_name` (text)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read/write access (since no auth is required)
*/

-- Picked Stocks Table
CREATE TABLE IF NOT EXISTS picked_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_name text NOT NULL,
  signal_type text NOT NULL,
  stock_price text NOT NULL,
  date text NOT NULL,
  source_file text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE picked_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view picked stocks"
  ON picked_stocks
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert picked stocks"
  ON picked_stocks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete picked stocks"
  ON picked_stocks
  FOR DELETE
  USING (true);

-- Suggestions Table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suggestions"
  ON suggestions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert suggestions"
  ON suggestions
  FOR INSERT
  WITH CHECK (true);

-- Suggestion Replies Table
CREATE TABLE IF NOT EXISTS suggestion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suggestion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suggestion replies"
  ON suggestion_replies
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert suggestion replies"
  ON suggestion_replies
  FOR INSERT
  WITH CHECK (true);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat messages"
  ON chat_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_picked_stocks_ticker ON picked_stocks(ticker_name);
CREATE INDEX IF NOT EXISTS idx_suggestion_replies_suggestion_id ON suggestion_replies(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
