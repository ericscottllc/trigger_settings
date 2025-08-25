/*
  # User Management Infrastructure

  1. New Tables
    - `users` - User profiles linked to auth.users
    - `roles` - System roles (Admin, Member, etc.)
    - `permissions` - Granular permissions
    - `role_permissions` - Many-to-many relationship between roles and permissions
    - `user_roles` - Many-to-many relationship between users and roles

  2. Security
    - Enable RLS on all tables
    - Add basic policies for authenticated users
    - Create indexes for performance

  3. Sample Data
    - Create Admin and Member roles
    - Create basic permissions
    - Assign permissions to roles
    - Create user profiles for existing users
*/

-- Create users table (profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_system_role boolean NOT NULL DEFAULT false, -- System roles cannot be deleted
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  resource text NOT NULL, -- e.g., 'crops', 'regions', 'users'
  action text NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be expanded later)
CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read active roles"
  ON roles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can read active permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can read role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('Admin', 'Full system administrator with all permissions', true),
  ('Member', 'Standard user with limited permissions', true)
ON CONFLICT (name) DO NOTHING;

-- Insert basic permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  -- User management
  ('users.create', 'Create new users', 'users', 'create'),
  ('users.read', 'View user information', 'users', 'read'),
  ('users.update', 'Update user information', 'users', 'update'),
  ('users.delete', 'Delete users', 'users', 'delete'),
  ('users.manage_roles', 'Assign roles to users', 'users', 'manage_roles'),
  
  -- Role management
  ('roles.create', 'Create new roles', 'roles', 'create'),
  ('roles.read', 'View roles', 'roles', 'read'),
  ('roles.update', 'Update roles', 'roles', 'update'),
  ('roles.delete', 'Delete roles', 'roles', 'delete'),
  ('roles.manage_permissions', 'Assign permissions to roles', 'roles', 'manage_permissions'),
  
  -- Crop management
  ('crops.create', 'Create crops and classes', 'crops', 'create'),
  ('crops.read', 'View crops and classes', 'crops', 'read'),
  ('crops.update', 'Update crops and classes', 'crops', 'update'),
  ('crops.delete', 'Delete crops and classes', 'crops', 'delete'),
  
  -- Region management
  ('regions.create', 'Create regions and associations', 'regions', 'create'),
  ('regions.read', 'View regions and associations', 'regions', 'read'),
  ('regions.update', 'Update regions and associations', 'regions', 'update'),
  ('regions.delete', 'Delete regions and associations', 'regions', 'delete'),
  
  -- Master data management
  ('master_data.create', 'Create master data records', 'master_data', 'create'),
  ('master_data.read', 'View master data', 'master_data', 'read'),
  ('master_data.update', 'Update master data', 'master_data', 'update'),
  ('master_data.delete', 'Delete master data', 'master_data', 'delete'),
  
  -- Grain entries
  ('grain_entries.create', 'Create grain entries', 'grain_entries', 'create'),
  ('grain_entries.read', 'View grain entries', 'grain_entries', 'read'),
  ('grain_entries.update', 'Update grain entries', 'grain_entries', 'update'),
  ('grain_entries.delete', 'Delete grain entries', 'grain_entries', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign limited permissions to Member role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Member'
  AND p.name IN (
    'crops.read',
    'regions.read',
    'master_data.read',
    'grain_entries.create',
    'grain_entries.read',
    'grain_entries.update',
    'grain_entries.delete',
    'users.read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create user profiles for existing users
INSERT INTO users (id, email, full_name, is_active) VALUES
  ('11a55b32-3a1d-4d67-8739-c721aa49b8ce', 'admin@triggergrain.ca', 'System Administrator', true),
  ('efc1cdb9-99ca-4cce-b6fb-1a49cf415cad', 'member@triggergrain.ca', 'Standard Member', true)
ON CONFLICT (id) DO NOTHING;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT 
  u.id,
  r.id,
  '11a55b32-3a1d-4d67-8739-c721aa49b8ce' -- Admin assigns roles
FROM users u
CROSS JOIN roles r
WHERE (u.id = '11a55b32-3a1d-4d67-8739-c721aa49b8ce' AND r.name = 'Admin')
   OR (u.id = 'efc1cdb9-99ca-4cce-b6fb-1a49cf415cad' AND r.name = 'Member')
ON CONFLICT (user_id, role_id) DO NOTHING;