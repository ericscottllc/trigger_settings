/*
  # Add Region and Association Tables

  1. New Tables
    - `master_regions`
      - `id` (uuid, primary key)
      - `name` (text, unique, required)
      - `code` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `region_associations`
      - `id` (uuid, primary key)
      - `region_id` (uuid, foreign key to master_regions)
      - `elevator_id` (uuid, foreign key to master_elevators)
      - `town_id` (uuid, foreign key to master_towns)
      - `crop_id` (uuid, foreign key to master_crops)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and manage data

  3. Features
    - Unique constraint on region names
    - Foreign key relationships with cascading updates
    - Automatic timestamp updates via triggers
    - Indexes for performance on foreign key columns
*/

-- Create master_regions table
CREATE TABLE IF NOT EXISTS master_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create region_associations table
CREATE TABLE IF NOT EXISTS region_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES master_regions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  elevator_id uuid NOT NULL REFERENCES master_elevators(id) ON UPDATE CASCADE ON DELETE CASCADE,
  town_id uuid NOT NULL REFERENCES master_towns(id) ON UPDATE CASCADE ON DELETE CASCADE,
  crop_id uuid NOT NULL REFERENCES master_crops(id) ON UPDATE CASCADE ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_region_associations_region_id ON region_associations(region_id);
CREATE INDEX IF NOT EXISTS idx_region_associations_elevator_id ON region_associations(elevator_id);
CREATE INDEX IF NOT EXISTS idx_region_associations_town_id ON region_associations(town_id);
CREATE INDEX IF NOT EXISTS idx_region_associations_crop_id ON region_associations(crop_id);
CREATE INDEX IF NOT EXISTS idx_region_associations_is_active ON region_associations(is_active);

-- Add unique constraint to prevent duplicate associations
CREATE UNIQUE INDEX IF NOT EXISTS idx_region_associations_unique 
ON region_associations(region_id, elevator_id, town_id, crop_id) 
WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE master_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_associations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_regions
CREATE POLICY "Authenticated users can read active regions"
  ON master_regions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage regions"
  ON master_regions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for region_associations
CREATE POLICY "Authenticated users can read active associations"
  ON region_associations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage associations"
  ON region_associations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_master_regions_updated_at
  BEFORE UPDATE ON master_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_region_associations_updated_at
  BEFORE UPDATE ON region_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();