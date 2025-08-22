/*
  # Add Crop Classification Schema

  1. New Tables
    - `crop_classes` - Market classes/categories (CWRS, CPSR, etc.)
    - `crop_specs` - Grade/spec attributes (protein %, moisture %, etc.)

  2. Relationships
    - crop_classes references master_crops
    - crop_specs references crop_classes
    - Cascading deletes maintain referential integrity

  3. Sample Data
    - Wheat classes: CWRS, CPSR, Special Purpose Wheat
    - Canola class: Standard Canola
    - Protein specifications for wheat classes

  4. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create crop_classes table
CREATE TABLE IF NOT EXISTS public.crop_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.master_crops(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crop_classes_pkey PRIMARY KEY (id),
  CONSTRAINT crop_classes_crop_id_name_key UNIQUE (crop_id, name)
);

-- Create crop_specs table
CREATE TABLE IF NOT EXISTS public.crop_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.crop_classes(id) ON DELETE CASCADE,
  protein_percent numeric(4,1) NULL,
  moisture_percent numeric(4,1) NULL,
  other_specs jsonb NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crop_specs_pkey PRIMARY KEY (id),
  CONSTRAINT crop_specs_class_id_protein_key UNIQUE (class_id, protein_percent)
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_crop_classes_updated_at
  BEFORE UPDATE ON crop_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crop_specs_updated_at
  BEFORE UPDATE ON crop_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE crop_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_specs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crop_classes
CREATE POLICY "Authenticated users can read active crop classes"
  ON crop_classes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage crop classes"
  ON crop_classes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for crop_specs
CREATE POLICY "Authenticated users can read active crop specs"
  ON crop_specs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage crop specs"
  ON crop_specs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crop_classes_crop_id ON crop_classes(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_classes_is_active ON crop_classes(is_active);
CREATE INDEX IF NOT EXISTS idx_crop_specs_class_id ON crop_specs(class_id);
CREATE INDEX IF NOT EXISTS idx_crop_specs_is_active ON crop_specs(is_active);

-- Insert sample data
-- First, let's get the crop IDs (assuming Wheat and Canola exist)
DO $$
DECLARE
  wheat_id uuid;
  canola_id uuid;
  cwrs_id uuid;
  cpsr_id uuid;
  spw_id uuid;
  canola_class_id uuid;
BEGIN
  -- Get existing crop IDs
  SELECT id INTO wheat_id FROM master_crops WHERE LOWER(name) = 'wheat' LIMIT 1;
  SELECT id INTO canola_id FROM master_crops WHERE LOWER(name) = 'canola' LIMIT 1;
  
  -- If crops don't exist, create them
  IF wheat_id IS NULL THEN
    INSERT INTO master_crops (name, code) VALUES ('Wheat', 'WHT') RETURNING id INTO wheat_id;
  END IF;
  
  IF canola_id IS NULL THEN
    INSERT INTO master_crops (name, code) VALUES ('Canola', 'CAN') RETURNING id INTO canola_id;
  END IF;
  
  -- Insert crop classes
  INSERT INTO crop_classes (crop_id, name, code, description) VALUES
    (wheat_id, 'Canada Western Red Spring', 'CWRS', 'Premium milling wheat with high protein content')
    ON CONFLICT (crop_id, name) DO NOTHING
    RETURNING id INTO cwrs_id;
  
  -- Get CWRS ID if it already existed
  IF cwrs_id IS NULL THEN
    SELECT id INTO cwrs_id FROM crop_classes WHERE crop_id = wheat_id AND name = 'Canada Western Red Spring';
  END IF;
  
  INSERT INTO crop_classes (crop_id, name, code, description) VALUES
    (wheat_id, 'Canada Prairie Spring Red', 'CPSR', 'General purpose wheat with moderate protein')
    ON CONFLICT (crop_id, name) DO NOTHING
    RETURNING id INTO cpsr_id;
  
  -- Get CPSR ID if it already existed
  IF cpsr_id IS NULL THEN
    SELECT id INTO cpsr_id FROM crop_classes WHERE crop_id = wheat_id AND name = 'Canada Prairie Spring Red';
  END IF;
  
  INSERT INTO crop_classes (crop_id, name, code, description) VALUES
    (wheat_id, 'Special Purpose Wheat', 'SPW', 'Specialty wheat for specific end uses')
    ON CONFLICT (crop_id, name) DO NOTHING
    RETURNING id INTO spw_id;
  
  -- Get SPW ID if it already existed
  IF spw_id IS NULL THEN
    SELECT id INTO spw_id FROM crop_classes WHERE crop_id = wheat_id AND name = 'Special Purpose Wheat';
  END IF;
  
  INSERT INTO crop_classes (crop_id, name, code, description) VALUES
    (canola_id, 'Standard Canola', 'STD', 'Standard canola for oil extraction')
    ON CONFLICT (crop_id, name) DO NOTHING
    RETURNING id INTO canola_class_id;
  
  -- Get Canola class ID if it already existed
  IF canola_class_id IS NULL THEN
    SELECT id INTO canola_class_id FROM crop_classes WHERE crop_id = canola_id AND name = 'Standard Canola';
  END IF;
  
  -- Insert crop specs
  INSERT INTO crop_specs (class_id, protein_percent) VALUES
    (cwrs_id, 13.5),
    (cpsr_id, 11.5)
    ON CONFLICT (class_id, protein_percent) DO NOTHING;
  
  -- Special Purpose Wheat typically doesn't have protein requirements
  INSERT INTO crop_specs (class_id, protein_percent, other_specs) VALUES
    (spw_id, NULL, '{"notes": "Protein requirements vary by specific end use"}')
    ON CONFLICT (class_id, protein_percent) DO NOTHING;
  
  -- Standard canola typically doesn't have protein specs, but may have oil content
  INSERT INTO crop_specs (class_id, protein_percent, other_specs) VALUES
    (canola_class_id, NULL, '{"oil_content_min": 40.0, "notes": "Minimum 40% oil content"}')
    ON CONFLICT (class_id, protein_percent) DO NOTHING;
END $$;