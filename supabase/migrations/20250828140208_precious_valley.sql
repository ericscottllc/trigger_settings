/*
  # Add RLS policies for junction tables

  1. Security
    - Enable RLS on all junction tables
    - Add policies for authenticated users with appropriate permissions
    - Follow existing RBAC pattern from other tables

  2. Tables Updated
    - `elevator_towns` - Elevator to Town associations
    - `town_regions` - Town to Region associations  
    - `region_crop_comparisons` - Region to Crop Comparison associations
    - `elevator_crops` - Elevator to Crop associations
    - `elevator_crop_classes` - Elevator to Crop Class associations

  3. Permissions Required
    - regions.read/create/update/delete for region-related tables
    - master_data.read/create/update/delete for elevator/town tables
    - crops.read/create/update/delete for crop-related tables
*/

-- Enable RLS on all junction tables
ALTER TABLE elevator_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE town_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_crop_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE elevator_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE elevator_crop_classes ENABLE ROW LEVEL SECURITY;

-- Elevator Towns policies
CREATE POLICY "Users with master_data.read can view elevator towns"
  ON elevator_towns
  FOR SELECT
  TO authenticated
  USING (has_permission('master_data'::text, 'read'::text));

CREATE POLICY "Users with master_data.create can create elevator towns"
  ON elevator_towns
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('master_data'::text, 'create'::text));

CREATE POLICY "Users with master_data.update can update elevator towns"
  ON elevator_towns
  FOR UPDATE
  TO authenticated
  USING (has_permission('master_data'::text, 'update'::text))
  WITH CHECK (has_permission('master_data'::text, 'update'::text));

CREATE POLICY "Users with master_data.delete can delete elevator towns"
  ON elevator_towns
  FOR DELETE
  TO authenticated
  USING (has_permission('master_data'::text, 'delete'::text));

-- Town Regions policies
CREATE POLICY "Users with regions.read can view town regions"
  ON town_regions
  FOR SELECT
  TO authenticated
  USING (has_permission('regions'::text, 'read'::text) OR has_permission('master_data'::text, 'read'::text));

CREATE POLICY "Users with regions.create can create town regions"
  ON town_regions
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('regions'::text, 'create'::text));

CREATE POLICY "Users with regions.update can update town regions"
  ON town_regions
  FOR UPDATE
  TO authenticated
  USING (has_permission('regions'::text, 'update'::text))
  WITH CHECK (has_permission('regions'::text, 'update'::text));

CREATE POLICY "Users with regions.delete can delete town regions"
  ON town_regions
  FOR DELETE
  TO authenticated
  USING (has_permission('regions'::text, 'delete'::text));

-- Region Crop Comparisons policies
CREATE POLICY "Users with regions.read can view region crop comparisons"
  ON region_crop_comparisons
  FOR SELECT
  TO authenticated
  USING (has_permission('regions'::text, 'read'::text) OR has_permission('crops'::text, 'read'::text));

CREATE POLICY "Users with regions.create can create region crop comparisons"
  ON region_crop_comparisons
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('regions'::text, 'create'::text));

CREATE POLICY "Users with regions.update can update region crop comparisons"
  ON region_crop_comparisons
  FOR UPDATE
  TO authenticated
  USING (has_permission('regions'::text, 'update'::text))
  WITH CHECK (has_permission('regions'::text, 'update'::text));

CREATE POLICY "Users with regions.delete can delete region crop comparisons"
  ON region_crop_comparisons
  FOR DELETE
  TO authenticated
  USING (has_permission('regions'::text, 'delete'::text));

-- Elevator Crops policies
CREATE POLICY "Users with master_data.read can view elevator crops"
  ON elevator_crops
  FOR SELECT
  TO authenticated
  USING (has_permission('master_data'::text, 'read'::text) OR has_permission('crops'::text, 'read'::text));

CREATE POLICY "Users with master_data.create can create elevator crops"
  ON elevator_crops
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('master_data'::text, 'create'::text));

CREATE POLICY "Users with master_data.update can update elevator crops"
  ON elevator_crops
  FOR UPDATE
  TO authenticated
  USING (has_permission('master_data'::text, 'update'::text))
  WITH CHECK (has_permission('master_data'::text, 'update'::text));

CREATE POLICY "Users with master_data.delete can delete elevator crops"
  ON elevator_crops
  FOR DELETE
  TO authenticated
  USING (has_permission('master_data'::text, 'delete'::text));

-- Elevator Crop Classes policies
CREATE POLICY "Users with master_data.read can view elevator crop classes"
  ON elevator_crop_classes
  FOR SELECT
  TO authenticated
  USING (has_permission('master_data'::text, 'read'::text) OR has_permission('crops'::text, 'read'::text));

CREATE POLICY "Users with master_data.create can create elevator crop classes"
  ON elevator_crop_classes
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('master_data'::text, 'create'::text));

CREATE POLICY "Users with master_data.update can update elevator crop classes"
  ON elevator_crop_classes
  FOR UPDATE
  TO authenticated
  USING (has_permission('master_data'::text, 'update'::text))
  WITH CHECK (has_permission('master_data'::text, 'update'::text));

CREATE POLICY "Users with master_data.delete can delete elevator crop classes"
  ON elevator_crop_classes
  FOR DELETE
  TO authenticated
  USING (has_permission('master_data'::text, 'delete'::text));