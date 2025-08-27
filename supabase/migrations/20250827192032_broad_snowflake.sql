/*
  # Clean Slate: Remove All RLS Policies and Disable RLS

  This migration completely removes the existing RLS and RBAC system to start fresh:
  
  1. Drop all existing RLS policies on all tables
  2. Disable Row Level Security on all tables
  3. Clean slate for reimagining the security system
  
  Note: This will make all data accessible to any authenticated user until new policies are implemented.
*/

-- Drop all existing policies on all tables
-- We'll drop policies for each table systematically

-- crop_classes policies
DROP POLICY IF EXISTS "Users with crops.create can create crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Users with crops.delete can delete crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Users with crops.read can view active crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Users with crops.update can update crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Authenticated users can manage crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Authenticated users can read active crop classes" ON crop_classes;

-- crop_specs policies
DROP POLICY IF EXISTS "Users with crops.create can create crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Users with crops.delete can delete crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Users with crops.read can view active crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Users with crops.update can update crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Authenticated users can manage crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Authenticated users can read active crop specs" ON crop_specs;

-- grain_entries policies
DROP POLICY IF EXISTS "Admin users can insert grain entries for any user" ON grain_entries;
DROP POLICY IF EXISTS "Admin users can read all grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Admin users can update all grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Admin users can delete grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Users can insert their own grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Users can read their own active grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Users can update their own grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Users with grain_entries.delete can delete grain entries" ON grain_entries;

-- master_crop_comparison policies
DROP POLICY IF EXISTS "Users with crops.create can create crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Users with crops.delete can delete crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Users with crops.read can view active crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Users with crops.update can update crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Authenticated users can manage crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Authenticated users can read active crop comparisons" ON master_crop_comparison;

-- master_crops policies
DROP POLICY IF EXISTS "Users with crops.create can create crops" ON master_crops;
DROP POLICY IF EXISTS "Users with crops.delete can delete crops" ON master_crops;
DROP POLICY IF EXISTS "Users with crops.read can view active crops" ON master_crops;
DROP POLICY IF EXISTS "Users with crops.update can update crops" ON master_crops;
DROP POLICY IF EXISTS "Authenticated users can manage crops" ON master_crops;
DROP POLICY IF EXISTS "Authenticated users can read active crops" ON master_crops;

-- master_elevators policies
DROP POLICY IF EXISTS "Users with regions.create can create elevators" ON master_elevators;
DROP POLICY IF EXISTS "Users with regions.delete can delete elevators" ON master_elevators;
DROP POLICY IF EXISTS "Users with regions.read can view active elevators" ON master_elevators;
DROP POLICY IF EXISTS "Users with regions.update can update elevators" ON master_elevators;
DROP POLICY IF EXISTS "Authenticated users can manage elevators" ON master_elevators;
DROP POLICY IF EXISTS "Authenticated users can read active elevators" ON master_elevators;

-- master_regions policies
DROP POLICY IF EXISTS "Users with regions.create can create regions" ON master_regions;
DROP POLICY IF EXISTS "Users with regions.delete can delete regions" ON master_regions;
DROP POLICY IF EXISTS "Users with regions.read can view active regions" ON master_regions;
DROP POLICY IF EXISTS "Users with regions.update can update regions" ON master_regions;
DROP POLICY IF EXISTS "Authenticated users can manage regions" ON master_regions;
DROP POLICY IF EXISTS "Authenticated users can read active regions" ON master_regions;

-- master_towns policies
DROP POLICY IF EXISTS "Users with regions.create can create towns" ON master_towns;
DROP POLICY IF EXISTS "Users with regions.delete can delete towns" ON master_towns;
DROP POLICY IF EXISTS "Users with regions.read can view active towns" ON master_towns;
DROP POLICY IF EXISTS "Users with regions.update can update towns" ON master_towns;
DROP POLICY IF EXISTS "Authenticated users can manage towns" ON master_towns;
DROP POLICY IF EXISTS "Authenticated users can read active towns" ON master_towns;

-- navigation_items policies
DROP POLICY IF EXISTS "Anyone can read active navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Users with master_data.create can create navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Users with master_data.delete can delete navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Users with master_data.read can view active navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Users with master_data.update can update navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can manage navigation items" ON navigation_items;

-- permissions policies
DROP POLICY IF EXISTS "Authenticated users can read active permissions" ON permissions;
DROP POLICY IF EXISTS "Users with roles.manage_permissions can create permissions" ON permissions;
DROP POLICY IF EXISTS "Users with roles.manage_permissions can delete permissions" ON permissions;
DROP POLICY IF EXISTS "Users with roles.manage_permissions can update permissions" ON permissions;
DROP POLICY IF EXISTS "Users with roles.read can view active permissions" ON permissions;

-- public_users policies
DROP POLICY IF EXISTS "Admins can read all user profiles" ON public_users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public_users;
DROP POLICY IF EXISTS "Users can update own profile or users with users.update can upd" ON public_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public_users;
DROP POLICY IF EXISTS "Users with users.create can create user profiles" ON public_users;
DROP POLICY IF EXISTS "Users with users.delete can delete user profiles" ON public_users;
DROP POLICY IF EXISTS "Users with users.read can view user profiles" ON public_users;

-- region_associations policies
DROP POLICY IF EXISTS "Users with regions.create can create associations" ON region_associations;
DROP POLICY IF EXISTS "Users with regions.delete can delete associations" ON region_associations;
DROP POLICY IF EXISTS "Users with regions.read can view active associations" ON region_associations;
DROP POLICY IF EXISTS "Users with regions.update can update associations" ON region_associations;
DROP POLICY IF EXISTS "Authenticated users can manage associations" ON region_associations;
DROP POLICY IF EXISTS "Authenticated users can read active associations" ON region_associations;

-- role_permissions policies
DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users with roles.manage_permissions can create role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users with roles.manage_permissions can delete role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users with roles.manage_permissions can update role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users with roles.read can view role permissions" ON role_permissions;

-- roles policies
DROP POLICY IF EXISTS "Authenticated users can read active roles" ON roles;
DROP POLICY IF EXISTS "Users with roles.create can create roles" ON roles;
DROP POLICY IF EXISTS "Users with roles.delete can delete roles" ON roles;
DROP POLICY IF EXISTS "Users with roles.read can view active roles" ON roles;
DROP POLICY IF EXISTS "Users with roles.update can update roles" ON roles;

-- schema_queries policies
DROP POLICY IF EXISTS "Users with master_data.create can create schema queries" ON schema_queries;
DROP POLICY IF EXISTS "Users with master_data.delete can delete schema queries" ON schema_queries;
DROP POLICY IF EXISTS "Users with master_data.read can view schema queries" ON schema_queries;
DROP POLICY IF EXISTS "Users with master_data.update can update schema queries" ON schema_queries;
DROP POLICY IF EXISTS "Authenticated users can manage schema queries" ON schema_queries;
DROP POLICY IF EXISTS "Authenticated users can read schema queries" ON schema_queries;

-- user_roles policies
DROP POLICY IF EXISTS "Authenticated users can read user roles" ON user_roles;
DROP POLICY IF EXISTS "Users with users.manage_roles can create user roles" ON user_roles;
DROP POLICY IF EXISTS "Users with users.manage_roles can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Users with users.manage_roles can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Users with users.read can view user roles" ON user_roles;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS user_has_permission(uuid, text, text);

-- Disable Row Level Security on all tables
ALTER TABLE crop_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE crop_specs DISABLE ROW LEVEL SECURITY;
ALTER TABLE grain_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_crop_comparison DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_elevators DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_towns DISABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE region_associations DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE schema_queries DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Note: All data is now accessible to any authenticated user
-- This provides a clean slate for implementing a new security system