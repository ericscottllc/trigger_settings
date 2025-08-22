/*
  # Add Crop Comparison Table and Update Region Associations

  1. New Tables
    - `master_crop_comparison`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `code` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - Add `crop_comparison_id` foreign key to `region_associations`
    - Update unique constraint to include crop comparison

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users
    - Update existing policies as needed

  4. Sample Data
    - Insert the 4 crop comparison records you specified
*/

-- Create master_crop_comparison table
CREATE TABLE IF NOT EXISTS master_crop_comparison (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_crop_comparison ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read active crop comparisons"
  ON master_crop_comparison
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage crop comparisons"
  ON master_crop_comparison
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_master_crop_comparison_updated_at
  BEFORE UPDATE ON master_crop_comparison
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the crop comparison data
INSERT INTO master_crop_comparison (name) VALUES
  ('#1 Canola Comparison'),
  ('#2 Special Purpose Wheat Comparison'),
  ('1 CWR 13.5 Comparison'),
  ('2 CPSR 11.5 Comparison');

-- Add crop_comparison_id to region_associations table
ALTER TABLE region_associations 
ADD COLUMN IF NOT EXISTS crop_comparison_id uuid REFERENCES master_crop_comparison(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Drop the old unique constraint
DROP INDEX IF EXISTS idx_region_associations_unique;

-- Create new unique constraint that includes crop_comparison_id
CREATE UNIQUE INDEX idx_region_associations_unique_with_comparison
  ON region_associations (region_id, elevator_id, town_id, crop_id, crop_comparison_id)
  WHERE is_active = true;

-- Add index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_region_associations_crop_comparison_id
  ON region_associations (crop_comparison_id);