/*
  # Insert Region Association Data

  1. Data Insertion
    - Insert all the region association data provided
    - Links regions, elevators, towns, crop classes, and crop comparisons
    - Handles missing elevators and towns by creating them
    - Uses proper foreign key relationships

  2. Data Structure
    - 47 total associations across 4 crop comparisons
    - 4 regions: Lloydminster, Unity-Battleford, Melfort, Crush Plants
    - Multiple crop classes: Standard Canola, Special Purpose Wheat, CWRS, CPSR
    - Various elevators and towns
*/

-- First, ensure we have all the required elevators (some have location suffixes)
INSERT INTO master_elevators (name) VALUES 
  ('G3 Maidstone'),
  ('G3 Vermilion'),
  ('Olymel'),
  ('GrainsConnect')
ON CONFLICT (name) DO NOTHING;

-- Ensure we have all the required towns
INSERT INTO master_towns (name) VALUES 
  ('N.Battleford'),
  ('Dixon'),
  ('Star City'),
  ('Picked up')
ON CONFLICT (name) DO NOTHING;

-- Ensure we have all the required regions
INSERT INTO master_regions (name) VALUES 
  ('Lloydminster'),
  ('Unity-Battleford'),
  ('Melfort'),
  ('Crush Plants')
ON CONFLICT (name) DO NOTHING;

-- Now insert all the region associations
-- We'll use CTEs to get the IDs we need

WITH 
comparison_ids AS (
  SELECT id, name FROM master_crop_comparison
),
region_ids AS (
  SELECT id, name FROM master_regions
),
elevator_ids AS (
  SELECT id, name FROM master_elevators
),
town_ids AS (
  SELECT id, name FROM master_towns
),
class_ids AS (
  SELECT cc.id, cc.name, mc.name as crop_name 
  FROM crop_classes cc 
  JOIN master_crops mc ON cc.crop_id = mc.id
)

INSERT INTO region_associations (
  crop_comparison_id,
  region_id,
  elevator_id,
  town_id,
  class_id
)
SELECT 
  comp.id as crop_comparison_id,
  reg.id as region_id,
  elev.id as elevator_id,
  town.id as town_id,
  class.id as class_id
FROM (VALUES
  -- #1 Canola Comparison - Lloydminster
  ('#1 Canola Comparison', 'Lloydminster', 'ADM', 'Lloydminster', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'G3 Maidstone', 'Maidstone', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'Pioneer', 'Marshall', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'Viterra', 'Lloydminster', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'Cargill', 'Vermilion', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'G3 Vermilion', 'Vermilion', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'Pioneer', 'Provost', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'Providence', 'Viking', 'Standard Canola'),
  ('#1 Canola Comparison', 'Lloydminster', 'P&H', 'Viking', 'Standard Canola'),
  
  -- #1 Canola Comparison - Unity-Battleford
  ('#1 Canola Comparison', 'Unity-Battleford', 'Viterra', 'N.Battleford', 'Standard Canola'),
  ('#1 Canola Comparison', 'Unity-Battleford', 'Cargill', 'N.Battleford', 'Standard Canola'),
  ('#1 Canola Comparison', 'Unity-Battleford', 'P&H', 'Hamlin', 'Standard Canola'),
  ('#1 Canola Comparison', 'Unity-Battleford', 'GrainsConnect', 'Maymont', 'Standard Canola'),
  ('#1 Canola Comparison', 'Unity-Battleford', 'Pioneer', 'Unity', 'Standard Canola'),
  
  -- #1 Canola Comparison - Melfort
  ('#1 Canola Comparison', 'Melfort', 'Viterra', 'Melfort', 'Standard Canola'),
  ('#1 Canola Comparison', 'Melfort', 'G3', 'Melfort', 'Standard Canola'),
  ('#1 Canola Comparison', 'Melfort', 'P&H', 'Tisdale', 'Standard Canola'),
  ('#1 Canola Comparison', 'Melfort', 'Viterra', 'Tisdale', 'Standard Canola'),
  ('#1 Canola Comparison', 'Melfort', 'ADM', 'Watson', 'Standard Canola'),
  ('#1 Canola Comparison', 'Melfort', 'Bunge', 'Dixon', 'Standard Canola'),
  
  -- #1 Canola Comparison - Crush Plants
  ('#1 Canola Comparison', 'Crush Plants', 'LDC', 'Yorkton', 'Standard Canola'),
  ('#1 Canola Comparison', 'Crush Plants', 'Cargill', 'Clavet', 'Standard Canola'),
  ('#1 Canola Comparison', 'Crush Plants', 'Bunge', 'Nipawin', 'Standard Canola'),
  ('#1 Canola Comparison', 'Crush Plants', 'ADM', 'Lloydminster', 'Standard Canola'),
  
  -- #2 Special Purpose Wheat Comparison - Melfort
  ('#2 Special Purpose Wheat Comparison', 'Melfort', 'G3', 'Melfort', 'Special Purpose Wheat'),
  ('#2 Special Purpose Wheat Comparison', 'Melfort', 'P&H', 'Tisdale', 'Special Purpose Wheat'),
  ('#2 Special Purpose Wheat Comparison', 'Melfort', 'Olymel', 'Star City', 'Special Purpose Wheat'),
  ('#2 Special Purpose Wheat Comparison', 'Melfort', 'Broker', 'Picked up', 'Special Purpose Wheat'),
  
  -- 1 CWR 13.5 Comparison - Lloydminster
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'G3 Maidstone', 'Maidstone', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'Pioneer', 'Marshall', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'Viterra', 'Lloydminster', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'Cargill', 'Vermilion', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'G3 Vermilion', 'Vermilion', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'Pioneer', 'Provost', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'Providence', 'Viking', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Lloydminster', 'P&H', 'Viking', 'Canada Western Red Spring'),
  
  -- 1 CWR 13.5 Comparison - Unity-Battleford
  ('1 CWR 13.5 Comparison', 'Unity-Battleford', 'Viterra', 'N.Battleford', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Unity-Battleford', 'Cargill', 'N.Battleford', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Unity-Battleford', 'P&H', 'Hamlin', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Unity-Battleford', 'GrainsConnect', 'Maymont', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Unity-Battleford', 'Pioneer', 'Unity', 'Canada Western Red Spring'),
  
  -- 1 CWR 13.5 Comparison - Melfort
  ('1 CWR 13.5 Comparison', 'Melfort', 'Viterra', 'Melfort', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Melfort', 'G3', 'Melfort', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Melfort', 'P&H', 'Tisdale', 'Canada Western Red Spring'),
  ('1 CWR 13.5 Comparison', 'Melfort', 'Viterra', 'Tisdale', 'Canada Western Red Spring'),
  
  -- 2 CPSR 11.5 Comparison - Lloydminster
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'G3 Maidstone', 'Maidstone', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'Husky', 'Lloydminster', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'Pioneer', 'Marshall', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'Viterra', 'Lloydminster', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'Cargill', 'Vermilion', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'G3 Vermilion', 'Vermilion', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'Providence', 'Viking', 'Canada Prairie Spring Red'),
  ('2 CPSR 11.5 Comparison', 'Lloydminster', 'P&H', 'Viking', 'Canada Prairie Spring Red')
) AS data(comparison_name, region_name, elevator_name, town_name, class_name)
JOIN comparison_ids comp ON comp.name = data.comparison_name
JOIN region_ids reg ON reg.name = data.region_name
JOIN elevator_ids elev ON elev.name = data.elevator_name
JOIN town_ids town ON town.name = data.town_name
JOIN class_ids class ON class.name = data.class_name
ON CONFLICT (region_id, elevator_id, town_id, class_id, crop_comparison_id) 
WHERE is_active = true 
DO NOTHING;