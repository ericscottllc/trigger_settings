/*
  # Fix RLS Policies to Use RBAC System

  This migration removes the overly permissive RLS policies and replaces them with
  policies that properly check the permissions table through the RBAC system.

  ## Changes Made:
  1. Drop all existing overly permissive policies
  2. Create helper function to check user permissions
  3. Create proper RBAC-based policies for all tables
  4. Fix grain_entries delete policy command mismatch
  5. Remove redundant policies

  ## Security Model:
  - All operations now check the permissions table
  - Users must have specific resource.action permissions
  - Admins are not hard-coded, they get permissions through roles
  - SELECT operations check for .read permission
  - INSERT operations check for .create permission  
  - UPDATE operations check for .update permission
  - DELETE operations check for .delete permission
*/

-- Drop all existing policies that bypass RBAC
DROP POLICY IF EXISTS "Authenticated users can manage crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Authenticated users can read active crop classes" ON crop_classes;
DROP POLICY IF EXISTS "Authenticated users can manage crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Authenticated users can read active crop specs" ON crop_specs;
DROP POLICY IF EXISTS "Authenticated users can manage crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Authenticated users can read active crop comparisons" ON master_crop_comparison;
DROP POLICY IF EXISTS "Authenticated users can manage crops" ON master_crops;
DROP POLICY IF EXISTS "Authenticated users can read active crops" ON master_crops;
DROP POLICY IF EXISTS "Authenticated users can manage elevators" ON master_elevators;
DROP POLICY IF EXISTS "Authenticated users can read active elevators" ON master_elevators;
DROP POLICY IF EXISTS "Authenticated users can manage regions" ON master_regions;
DROP POLICY IF EXISTS "Authenticated users can read active regions" ON master_regions;
DROP POLICY IF EXISTS "Authenticated users can manage towns" ON master_towns;
DROP POLICY IF EXISTS "Authenticated users can read active towns" ON master_towns;
DROP POLICY IF EXISTS "Authenticated users can manage associations" ON region_associations;
DROP POLICY IF EXISTS "Authenticated users can read active associations" ON region_associations;
DROP POLICY IF EXISTS "Authenticated users can manage navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can manage schema queries" ON schema_queries;
DROP POLICY IF EXISTS "Authenticated users can read schema queries" ON schema_queries;

-- Drop the incorrectly named grain_entries delete policy (it was UPDATE, not DELETE)
DROP POLICY IF EXISTS "Admin users can delete grain entries" ON grain_entries;

-- Create helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id uuid, resource_name text, action_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_has_permission.user_id
      AND r.is_active = true
      AND p.is_active = true
      AND p.resource = resource_name
      AND p.action = action_name
  );
$$;

-- CROPS POLICIES
CREATE POLICY "Users with crops.read can view active crops"
  ON master_crops FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'crops', 'read'));

CREATE POLICY "Users with crops.create can create crops"
  ON master_crops FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'create'));

CREATE POLICY "Users with crops.update can update crops"
  ON master_crops FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crops"
  ON master_crops FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'delete'));

-- CROP CLASSES POLICIES
CREATE POLICY "Users with crops.read can view active crop classes"
  ON crop_classes FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'crops', 'read'));

CREATE POLICY "Users with crops.create can create crop classes"
  ON crop_classes FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'create'));

CREATE POLICY "Users with crops.update can update crop classes"
  ON crop_classes FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crop classes"
  ON crop_classes FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'delete'));

-- CROP SPECS POLICIES
CREATE POLICY "Users with crops.read can view active crop specs"
  ON crop_specs FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'crops', 'read'));

CREATE POLICY "Users with crops.create can create crop specs"
  ON crop_specs FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'create'));

CREATE POLICY "Users with crops.update can update crop specs"
  ON crop_specs FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crop specs"
  ON crop_specs FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'delete'));

-- CROP COMPARISON POLICIES
CREATE POLICY "Users with crops.read can view active crop comparisons"
  ON master_crop_comparison FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'crops', 'read'));

CREATE POLICY "Users with crops.create can create crop comparisons"
  ON master_crop_comparison FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'create'));

CREATE POLICY "Users with crops.update can update crop comparisons"
  ON master_crop_comparison FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crop comparisons"
  ON master_crop_comparison FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'crops', 'delete'));

-- REGIONS POLICIES
CREATE POLICY "Users with regions.read can view active regions"
  ON master_regions FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'regions', 'read'));

CREATE POLICY "Users with regions.create can create regions"
  ON master_regions FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'create'));

CREATE POLICY "Users with regions.update can update regions"
  ON master_regions FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'update'));

CREATE POLICY "Users with regions.delete can delete regions"
  ON master_regions FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'delete'));

-- ELEVATORS POLICIES
CREATE POLICY "Users with regions.read can view active elevators"
  ON master_elevators FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'regions', 'read'));

CREATE POLICY "Users with regions.create can create elevators"
  ON master_elevators FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'create'));

CREATE POLICY "Users with regions.update can update elevators"
  ON master_elevators FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'update'));

CREATE POLICY "Users with regions.delete can delete elevators"
  ON master_elevators FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'delete'));

-- TOWNS POLICIES
CREATE POLICY "Users with regions.read can view active towns"
  ON master_towns FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'regions', 'read'));

CREATE POLICY "Users with regions.create can create towns"
  ON master_towns FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'create'));

CREATE POLICY "Users with regions.update can update towns"
  ON master_towns FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'update'));

CREATE POLICY "Users with regions.delete can delete towns"
  ON master_towns FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'delete'));

-- REGION ASSOCIATIONS POLICIES
CREATE POLICY "Users with regions.read can view active associations"
  ON region_associations FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'regions', 'read'));

CREATE POLICY "Users with regions.create can create associations"
  ON region_associations FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'create'));

CREATE POLICY "Users with regions.update can update associations"
  ON region_associations FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'regions', 'update'));

CREATE POLICY "Users with regions.delete can delete associations"
  ON region_associations FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'regions', 'delete'));

-- NAVIGATION ITEMS POLICIES (keep public read for active items)
CREATE POLICY "Users with master_data.read can view active navigation items"
  ON navigation_items FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'master_data', 'read'));

CREATE POLICY "Users with master_data.create can create navigation items"
  ON navigation_items FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'master_data', 'create'));

CREATE POLICY "Users with master_data.update can update navigation items"
  ON navigation_items FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'master_data', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'master_data', 'update'));

CREATE POLICY "Users with master_data.delete can delete navigation items"
  ON navigation_items FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'master_data', 'delete'));

-- Keep the public read policy for navigation items (needed for unauthenticated users)
CREATE POLICY "Anyone can read active navigation items"
  ON navigation_items FOR SELECT
  TO public
  USING (is_active = true);

-- SCHEMA QUERIES POLICIES
CREATE POLICY "Users with master_data.read can view schema queries"
  ON schema_queries FOR SELECT
  TO authenticated
  USING (user_has_permission(auth.uid(), 'master_data', 'read'));

CREATE POLICY "Users with master_data.create can create schema queries"
  ON schema_queries FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'master_data', 'create'));

CREATE POLICY "Users with master_data.update can update schema queries"
  ON schema_queries FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'master_data', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'master_data', 'update'));

CREATE POLICY "Users with master_data.delete can delete schema queries"
  ON schema_queries FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'master_data', 'delete'));

-- PERMISSIONS POLICIES (add missing management policies)
CREATE POLICY "Users with roles.read can view active permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'roles', 'read'));

CREATE POLICY "Users with roles.manage_permissions can create permissions"
  ON permissions FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'roles', 'manage_permissions'));

CREATE POLICY "Users with roles.manage_permissions can update permissions"
  ON permissions FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'manage_permissions'))
  WITH CHECK (user_has_permission(auth.uid(), 'roles', 'manage_permissions'));

CREATE POLICY "Users with roles.manage_permissions can delete permissions"
  ON permissions FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'manage_permissions'));

-- ROLES POLICIES (add missing management policies)
CREATE POLICY "Users with roles.read can view active roles"
  ON roles FOR SELECT
  TO authenticated
  USING (is_active = true AND user_has_permission(auth.uid(), 'roles', 'read'));

CREATE POLICY "Users with roles.create can create roles"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'roles', 'create'));

CREATE POLICY "Users with roles.update can update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'update'))
  WITH CHECK (user_has_permission(auth.uid(), 'roles', 'update'));

CREATE POLICY "Users with roles.delete can delete roles"
  ON roles FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'delete'));

-- ROLE PERMISSIONS POLICIES (add missing management policies)
CREATE POLICY "Users with roles.read can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'read'));

CREATE POLICY "Users with roles.manage_permissions can create role permissions"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'roles', 'manage_permissions'));

CREATE POLICY "Users with roles.manage_permissions can update role permissions"
  ON role_permissions FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'manage_permissions'))
  WITH CHECK (user_has_permission(auth.uid(), 'roles', 'manage_permissions'));

CREATE POLICY "Users with roles.manage_permissions can delete role permissions"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'roles', 'manage_permissions'));

-- USER ROLES POLICIES (add missing management policies)
CREATE POLICY "Users with users.read can view user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_has_permission(auth.uid(), 'users', 'read'));

CREATE POLICY "Users with users.manage_roles can create user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'users', 'manage_roles'));

CREATE POLICY "Users with users.manage_roles can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'users', 'manage_roles'))
  WITH CHECK (user_has_permission(auth.uid(), 'users', 'manage_roles'));

CREATE POLICY "Users with users.manage_roles can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'users', 'manage_roles'));

-- PUBLIC USERS POLICIES (add missing admin management policies)
CREATE POLICY "Users with users.read can view user profiles"
  ON public_users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    user_has_permission(auth.uid(), 'users', 'read')
  );

CREATE POLICY "Users with users.create can create user profiles"
  ON public_users FOR INSERT
  TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'users', 'create'));

CREATE POLICY "Users can update own profile or users with users.update can update any"
  ON public_users FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    user_has_permission(auth.uid(), 'users', 'update')
  )
  WITH CHECK (
    auth.uid() = id OR 
    user_has_permission(auth.uid(), 'users', 'update')
  );

CREATE POLICY "Users with users.delete can delete user profiles"
  ON public_users FOR DELETE
  TO authenticated
  USING (user_has_permission(auth.uid(), 'users', 'delete'));

-- Fix the grain_entries delete policy (was incorrectly named and used UPDATE command)
CREATE POLICY "Users with grain_entries.delete can delete grain entries"
  ON grain_entries FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_has_permission(auth.uid(), 'grain_entries', 'delete')
  );