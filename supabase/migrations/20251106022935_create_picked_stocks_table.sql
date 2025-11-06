/*
  # Create picked_stocks table

  1. New Tables
    - `picked_stocks`
      - `id` (uuid, primary key)
      - `ticker_name` (text)
      - `signal_type` (text)
      - `stock_price` (text)
      - `date` (text)
      - `source_file` (text)
      - `priority` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `picked_stocks` table
    - Add policy for all users to read and write data
*/

CREATE TABLE IF NOT EXISTS picked_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_name text NOT NULL,
  signal_type text NOT NULL,
  stock_price text NOT NULL,
  date text NOT NULL,
  source_file text NOT NULL,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE picked_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to read picked_stocks"
  ON picked_stocks FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow all users to insert picked_stocks"
  ON picked_stocks FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow all users to update picked_stocks"
  ON picked_stocks FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete picked_stocks"
  ON picked_stocks FOR DELETE
  TO authenticated, anon
  USING (true);
