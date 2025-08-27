/*
  # Complete RBAC and RLS System Implementation

  This migration creates a comprehensive Role-Based Access Control (RBAC) system
  with Row Level Security (RLS) policies that respect the permissions framework.

  ## What this migration does:
  1. Creates all permissions for system resources
  2. Creates Admin and Member roles
  3. Assigns permissions to roles
  4. Creates helper functions for permission checking
  5. Enables RLS on all tables
  6. Creates comprehensive RLS policies

  ## Security Model:
  - **Admin**: Full access to everything
  - **Member**: Can manage their own data, read-only access to master data
  - **Public**: Can read active navigation items only

  ## Resources and Permissions:
  - users: create, read, update, delete, manage_roles
  - roles: create, read, update, delete, manage_permissions
  - master_data: create, read, update, delete (covers all master_* tables)
  - crops: create, read, update, delete (covers crop_* tables)
  - regions: create, read, update, delete (covers region_* tables)
  - grain_entries: create, read, update, delete
  - navigation: create, read, update, delete
  - schema: read, manage (for schema_queries)
*/

-- ============================================================================
-- 1. CREATE PERMISSIONS
-- ============================================================================

INSERT INTO permissions (name, description, resource, action) VALUES
-- User management permissions
('users.create', 'Create new users', 'users', 'create'),
('users.read', 'View user information', 'users', 'read'),
('users.update', 'Update user information', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('users.manage_roles', 'Assign roles to users', 'users', 'manage_roles'),

-- Role management permissions
('roles.create', 'Create new roles', 'roles', 'create'),
('roles.read', 'View roles', 'roles', 'read'),
('roles.update', 'Update roles', 'roles', 'update'),
('roles.delete', 'Delete roles', 'roles', 'delete'),
('roles.manage_permissions', 'Assign permissions to roles', 'roles', 'manage_permissions'),

-- Master data permissions (elevators, towns, regions, crop_comparison)
('master_data.create', 'Create master data records', 'master_data', 'create'),
('master_data.read', 'View master data', 'master_data', 'read'),
('master_data.update', 'Update master data', 'master_data', 'update'),
('master_data.delete', 'Delete master data', 'master_data', 'delete'),

-- Crop management permissions (crops, classes, specs)
('crops.create', 'Create crops and classes', 'crops', 'create'),
('crops.read', 'View crops and classes', 'crops', 'read'),
('crops.update', 'Update crops and classes', 'crops', 'update'),
('crops.delete', 'Delete crops and classes', 'crops', 'delete'),

-- Region management permissions (regions, associations)
('regions.create', 'Create regions and associations', 'regions', 'create'),
('regions.read', 'View regions and associations', 'regions', 'read'),
('regions.update', 'Update regions and associations', 'regions', 'update'),
('regions.delete', 'Delete regions and associations', 'regions', 'delete'),

-- Grain entries permissions
('grain_entries.create', 'Create grain entries', 'grain_entries', 'create'),
('grain_entries.read', 'View grain entries', 'grain_entries', 'read'),
('grain_entries.update', 'Update grain entries', 'grain_entries', 'update'),
('grain_entries.delete', 'Delete grain entries', 'grain_entries', 'delete'),

-- Navigation management permissions
('navigation.create', 'Create navigation items', 'navigation', 'create'),
('navigation.read', 'View navigation items', 'navigation', 'read'),
('navigation.update', 'Update navigation items', 'navigation', 'update'),
('navigation.delete', 'Delete navigation items', 'navigation', 'delete'),

-- Schema management permissions
('schema.read', 'View schema queries', 'schema', 'read'),
('schema.manage', 'Manage schema queries', 'schema', 'manage');

-- ============================================================================
-- 2. CREATE ROLES
-- ============================================================================

INSERT INTO roles (name, description, is_system_role) VALUES
('Admin', 'Full system administrator with all permissions', true),
('Member', 'Standard user with limited permissions', true);

-- ============================================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- Get role IDs
DO $$
DECLARE
    admin_role_id uuid;
    member_role_id uuid;
    perm_record record;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
    SELECT id INTO member_role_id FROM roles WHERE name = 'Member';
    
    -- Assign ALL permissions to Admin role
    FOR perm_record IN SELECT id FROM permissions WHERE is_active = true
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_record.id);
    END LOOP;
    
    -- Assign specific permissions to Member role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT member_role_id, p.id
    FROM permissions p
    WHERE p.name IN (
        -- Members can read most things
        'users.read',
        'roles.read', 
        'master_data.read',
        'crops.read',
        'regions.read',
        'navigation.read',
        'schema.read',
        -- Members can fully manage their own grain entries
        'grain_entries.create',
        'grain_entries.read',
        'grain_entries.update',
        'grain_entries.delete'
    ) AND p.is_active = true;
END $$;

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(resource_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND r.is_active = true
        AND p.is_active = true
        AND p.resource = resource_name
        AND p.action = action_name
    );
END;
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    );
END;
$$;

-- Function to check if current user owns a record
CREATE OR REPLACE FUNCTION owns_record(record_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN auth.uid() = record_user_id;
END;
$$;

-- ============================================================================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_elevators ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_crop_comparison ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE grain_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_queries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- PUBLIC_USERS policies
CREATE POLICY "Admin can manage all users" ON public_users
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Users can read their own profile" ON public_users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public_users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ROLES policies
CREATE POLICY "Users with roles.read can view roles" ON roles
    FOR SELECT TO authenticated
    USING (has_permission('roles', 'read'));

CREATE POLICY "Users with roles.create can create roles" ON roles
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('roles', 'create'));

CREATE POLICY "Users with roles.update can update roles" ON roles
    FOR UPDATE TO authenticated
    USING (has_permission('roles', 'update'))
    WITH CHECK (has_permission('roles', 'update'));

CREATE POLICY "Users with roles.delete can delete roles" ON roles
    FOR DELETE TO authenticated
    USING (has_permission('roles', 'delete'));

-- PERMISSIONS policies
CREATE POLICY "Authenticated users can read permissions" ON permissions
    FOR SELECT TO authenticated
    USING (true);

-- USER_ROLES policies
CREATE POLICY "Users with users.manage_roles can manage user roles" ON user_roles
    FOR ALL TO authenticated
    USING (has_permission('users', 'manage_roles'))
    WITH CHECK (has_permission('users', 'manage_roles'));

CREATE POLICY "Users can read user role assignments" ON user_roles
    FOR SELECT TO authenticated
    USING (true);

-- ROLE_PERMISSIONS policies
CREATE POLICY "Users with roles.manage_permissions can manage role permissions" ON role_permissions
    FOR ALL TO authenticated
    USING (has_permission('roles', 'manage_permissions'))
    WITH CHECK (has_permission('roles', 'manage_permissions'));

CREATE POLICY "Users can read role permissions" ON role_permissions
    FOR SELECT TO authenticated
    USING (true);

-- MASTER_CROPS policies
CREATE POLICY "Users with master_data.read can view crops" ON master_crops
    FOR SELECT TO authenticated
    USING (has_permission('master_data', 'read') OR has_permission('crops', 'read'));

CREATE POLICY "Users with crops.create can create crops" ON master_crops
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('crops', 'create'));

CREATE POLICY "Users with crops.update can update crops" ON master_crops
    FOR UPDATE TO authenticated
    USING (has_permission('crops', 'update'))
    WITH CHECK (has_permission('crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crops" ON master_crops
    FOR DELETE TO authenticated
    USING (has_permission('crops', 'delete'));

-- MASTER_ELEVATORS policies
CREATE POLICY "Users with master_data.read can view elevators" ON master_elevators
    FOR SELECT TO authenticated
    USING (has_permission('master_data', 'read'));

CREATE POLICY "Users with master_data.create can create elevators" ON master_elevators
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('master_data', 'create'));

CREATE POLICY "Users with master_data.update can update elevators" ON master_elevators
    FOR UPDATE TO authenticated
    USING (has_permission('master_data', 'update'))
    WITH CHECK (has_permission('master_data', 'update'));

CREATE POLICY "Users with master_data.delete can delete elevators" ON master_elevators
    FOR DELETE TO authenticated
    USING (has_permission('master_data', 'delete'));

-- MASTER_TOWNS policies
CREATE POLICY "Users with master_data.read can view towns" ON master_towns
    FOR SELECT TO authenticated
    USING (has_permission('master_data', 'read'));

CREATE POLICY "Users with master_data.create can create towns" ON master_towns
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('master_data', 'create'));

CREATE POLICY "Users with master_data.update can update towns" ON master_towns
    FOR UPDATE TO authenticated
    USING (has_permission('master_data', 'update'))
    WITH CHECK (has_permission('master_data', 'update'));

CREATE POLICY "Users with master_data.delete can delete towns" ON master_towns
    FOR DELETE TO authenticated
    USING (has_permission('master_data', 'delete'));

-- MASTER_REGIONS policies
CREATE POLICY "Users with regions.read can view regions" ON master_regions
    FOR SELECT TO authenticated
    USING (has_permission('regions', 'read') OR has_permission('master_data', 'read'));

CREATE POLICY "Users with regions.create can create regions" ON master_regions
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('regions', 'create'));

CREATE POLICY "Users with regions.update can update regions" ON master_regions
    FOR UPDATE TO authenticated
    USING (has_permission('regions', 'update'))
    WITH CHECK (has_permission('regions', 'update'));

CREATE POLICY "Users with regions.delete can delete regions" ON master_regions
    FOR DELETE TO authenticated
    USING (has_permission('regions', 'delete'));

-- MASTER_CROP_COMPARISON policies
CREATE POLICY "Users with crops.read can view crop comparisons" ON master_crop_comparison
    FOR SELECT TO authenticated
    USING (has_permission('crops', 'read') OR has_permission('master_data', 'read'));

CREATE POLICY "Users with crops.create can create crop comparisons" ON master_crop_comparison
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('crops', 'create'));

CREATE POLICY "Users with crops.update can update crop comparisons" ON master_crop_comparison
    FOR UPDATE TO authenticated
    USING (has_permission('crops', 'update'))
    WITH CHECK (has_permission('crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crop comparisons" ON master_crop_comparison
    FOR DELETE TO authenticated
    USING (has_permission('crops', 'delete'));

-- CROP_CLASSES policies
CREATE POLICY "Users with crops.read can view crop classes" ON crop_classes
    FOR SELECT TO authenticated
    USING (has_permission('crops', 'read'));

CREATE POLICY "Users with crops.create can create crop classes" ON crop_classes
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('crops', 'create'));

CREATE POLICY "Users with crops.update can update crop classes" ON crop_classes
    FOR UPDATE TO authenticated
    USING (has_permission('crops', 'update'))
    WITH CHECK (has_permission('crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crop classes" ON crop_classes
    FOR DELETE TO authenticated
    USING (has_permission('crops', 'delete'));

-- CROP_SPECS policies
CREATE POLICY "Users with crops.read can view crop specs" ON crop_specs
    FOR SELECT TO authenticated
    USING (has_permission('crops', 'read'));

CREATE POLICY "Users with crops.create can create crop specs" ON crop_specs
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('crops', 'create'));

CREATE POLICY "Users with crops.update can update crop specs" ON crop_specs
    FOR UPDATE TO authenticated
    USING (has_permission('crops', 'update'))
    WITH CHECK (has_permission('crops', 'update'));

CREATE POLICY "Users with crops.delete can delete crop specs" ON crop_specs
    FOR DELETE TO authenticated
    USING (has_permission('crops', 'delete'));

-- REGION_ASSOCIATIONS policies
CREATE POLICY "Users with regions.read can view associations" ON region_associations
    FOR SELECT TO authenticated
    USING (has_permission('regions', 'read'));

CREATE POLICY "Users with regions.create can create associations" ON region_associations
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('regions', 'create'));

CREATE POLICY "Users with regions.update can update associations" ON region_associations
    FOR UPDATE TO authenticated
    USING (has_permission('regions', 'update'))
    WITH CHECK (has_permission('regions', 'update'));

CREATE POLICY "Users with regions.delete can delete associations" ON region_associations
    FOR DELETE TO authenticated
    USING (has_permission('regions', 'delete'));

-- GRAIN_ENTRIES policies
CREATE POLICY "Admin can manage all grain entries" ON grain_entries
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own grain entries" ON grain_entries
    FOR ALL TO authenticated
    USING (owns_record(user_id))
    WITH CHECK (owns_record(user_id));

-- NAVIGATION_ITEMS policies
CREATE POLICY "Public can read active navigation items" ON navigation_items
    FOR SELECT TO public
    USING (is_active = true);

CREATE POLICY "Users with navigation.read can view navigation items" ON navigation_items
    FOR SELECT TO authenticated
    USING (has_permission('navigation', 'read'));

CREATE POLICY "Users with navigation.create can create navigation items" ON navigation_items
    FOR INSERT TO authenticated
    WITH CHECK (has_permission('navigation', 'create'));

CREATE POLICY "Users with navigation.update can update navigation items" ON navigation_items
    FOR UPDATE TO authenticated
    USING (has_permission('navigation', 'update'))
    WITH CHECK (has_permission('navigation', 'update'));

CREATE POLICY "Users with navigation.delete can delete navigation items" ON navigation_items
    FOR DELETE TO authenticated
    USING (has_permission('navigation', 'delete'));

-- SCHEMA_QUERIES policies
CREATE POLICY "Users with schema.read can view schema queries" ON schema_queries
    FOR SELECT TO authenticated
    USING (has_permission('schema', 'read'));

CREATE POLICY "Users with schema.manage can manage schema queries" ON schema_queries
    FOR ALL TO authenticated
    USING (has_permission('schema', 'manage'))
    WITH CHECK (has_permission('schema', 'manage'));