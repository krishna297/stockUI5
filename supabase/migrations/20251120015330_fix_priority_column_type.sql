/*
  # Fix priority column type in picked_stocks

  1. Changes
    - Convert priority column from integer to text
    - Set default to 'low'
    - Update existing integer values to text equivalents
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'picked_stocks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE picked_stocks ADD COLUMN priority_text text DEFAULT 'low';
    UPDATE picked_stocks SET priority_text = 
      CASE 
        WHEN priority = 1 THEN 'high'
        WHEN priority = 2 THEN 'moderate'
        WHEN priority = 3 THEN 'low'
        ELSE 'low'
      END;
    ALTER TABLE picked_stocks DROP COLUMN priority;
    ALTER TABLE picked_stocks RENAME COLUMN priority_text TO priority;
  END IF;
END $$;
