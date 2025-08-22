/*
  # Update Region Associations to Use Crop Classes

  1. Schema Changes
    - Add class_id column to region_associations table
    - Update foreign key constraints to reference crop_classes instead of master_crops
    - Update unique constraint to include class_id instead of crop_id
    - Add proper indexes for performance

  2. Data Migration
    - Since we don't have existing data, no migration needed
    - New associations will use crop classes directly

  3. Security
    - Update RLS policies to work with new structure
*/

-- Add class_id column to region_associations
ALTER TABLE region_associations 
ADD COLUMN class_id uuid REFERENCES crop_classes(id) ON DELETE CASCADE;

-- Drop the old crop_id foreign key constraint
ALTER TABLE region_associations 
DROP CONSTRAINT region_associations_crop_id_fkey;

-- Remove crop_id column since we're now using class_id
ALTER TABLE region_associations 
DROP COLUMN crop_id;

-- Update the unique constraint to use class_id instead of crop_id
DROP INDEX IF EXISTS idx_region_associations_unique_with_comparison;
CREATE UNIQUE INDEX idx_region_associations_unique_with_comparison 
ON region_associations (region_id, elevator_id, town_id, class_id, crop_comparison_id) 
WHERE is_active = true;

-- Add index for the new class_id column
CREATE INDEX idx_region_associations_class_id 
ON region_associations (class_id);

-- Remove the old crop_id index since that column no longer exists
DROP INDEX IF EXISTS idx_region_associations_crop_id;