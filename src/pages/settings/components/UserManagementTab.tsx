import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Search,
  UserPlus,
  Settings,
  Crown,
  User,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Button, Modal, Input, Card } from '../../../components/Shared/SharedComponents';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
  user_count?: number;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

type TabType = 'users' | 'roles' | 'permissions';

export const UserManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditUserRolesModal, setShowEditUserRolesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const { error: showError, success: showSuccess } = useNotifications();

  // Load all user management data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          user_roles!user_roles_user_id_fkey!inner(
            role_id,
            roles!inner(*)
          )
        `)
        .eq('is_active', true)
        .order('full_name');

      if (usersError) throw usersError;

      // Load roles with their permissions and user counts
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions!inner(
            permission_id,
            permissions!inner(*)
          ),
          user_roles(count)
        `)
        .eq('is_active', true)
        .order('name');

      if (rolesError) throw rolesError;

      // Load all permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .eq('is_active', true)
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (permissionsError) throw permissionsError;

      // Process users data
      const processedUsers = (usersData || []).map((user: any) => ({
        ...user,
        roles: user.user_roles?.map((ur: any) => ur.roles) || []
      }));

      // Process roles data
      const processedRoles = (rolesData || []).map((role: any) => ({
        ...role,
        permissions: role.role_permissions?.map((rp: any) => rp.permissions) || [],
        user_count: role.user_roles?.[0]?.count || 0
      }));

      setUsers(processedUsers);
      setRoles(processedRoles);
      setPermissions(permissionsData || []);

      showSuccess('Data loaded', `Loaded ${processedUsers.length} users, ${processedRoles.length} roles, ${permissionsData?.length || 0} permissions`);
    } catch (err) {
      console.error('Error loading user management data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      showError('Failed to load data', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Toggle role expansion
  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Add new role
  const addRole = async () => {
    if (!newRole.name.trim()) return;

    try {
      const { error: insertError } = await supabase
        .from('roles')
        .insert({
          name: newRole.name.trim(),
          description: newRole.description.trim() || null,
          is_system_role: false
        });

      if (insertError) throw insertError;

      showSuccess('Role added', `${newRole.name} has been added successfully`);
      setShowAddRoleModal(false);
      setNewRole({ name: '', description: '' });
      loadData();
    } catch (err) {
      console.error('Error adding role:', err);
      showError('Failed to add role', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Open edit user roles modal
  const openEditUserRoles = (user: User) => {
    setSelectedUser(user);
    setShowEditUserRolesModal(true);
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter data based on search term
  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tg-primary rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <p className="text-gray-600">Manage users, roles, and permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadData}
              loading={loading}
              icon={RefreshCw}
              variant="outline"
            >
              Refresh
            </Button>
            {activeTab === 'roles' && (
              <Button
                onClick={() => setShowAddRoleModal(true)}
                icon={Plus}
              >
                Add Role
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
          {[
            { id: 'users' as TabType, title: 'Users', icon: Users, count: users.length },
            { id: 'roles' as TabType, title: 'Roles', icon: Shield, count: roles.length },
            { id: 'permissions' as TabType, title: 'Permissions', icon: Key, count: permissions.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-tg-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-tg-primary/10 text-tg-primary' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-tg-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading {activeTab}...</p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && !loading && (
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No users match your search criteria' : 'No users in the system'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-tg-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {user.full_name || 'Unnamed User'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Roles:</span>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <span
                                key={role.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  role.name === 'Admin'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {role.name === 'Admin' && <Crown className="w-3 h-3 mr-1" />}
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openEditUserRoles(user)}
                          size="sm"
                          variant="outline"
                          icon={Settings}
                        >
                          Manage Roles
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && !loading && (
          <div className="space-y-4">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No roles found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No roles match your search criteria' : 'No roles defined'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoles.map((role) => {
                  const isExpanded = expandedRoles.has(role.id);
                  
                  return (
                    <Card key={role.id} className="overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleRoleExpansion(role.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                role.name === 'Admin' ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                                {role.name === 'Admin' ? (
                                  <Crown className={`w-4 h-4 ${role.name === 'Admin' ? 'text-red-600' : 'text-blue-600'}`} />
                                ) : (
                                  <Shield className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-800">{role.name}</h3>
                                {role.is_system_role && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    System
                                  </span>
                                )}
                              </div>
                              {role.description && (
                                <p className="text-sm text-gray-600">{role.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{role.user_count} user{role.user_count !== 1 ? 's' : ''}</span>
                            <span>{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Role Permissions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-200 bg-gray-50"
                          >
                            <div className="p-4">
                              <h4 className="font-medium text-gray-800 mb-3">Permissions</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {role.permissions.map((permission) => (
                                  <div
                                    key={permission.id}
                                    className="bg-white rounded-lg border border-gray-200 p-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Key className="w-3 h-3 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-800">
                                        {permission.resource}.{permission.action}
                                      </span>
                                    </div>
                                    {permission.description && (
                                      <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && !loading && (
          <div className="space-y-4">
            {filteredPermissions.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No permissions found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No permissions match your search criteria' : 'No permissions defined'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPermissions.map((permission) => (
                  <Card key={permission.id}>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-tg-primary" />
                        <h3 className="font-semibold text-gray-800">{permission.name}</h3>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Resource:</span>
                          <span className="font-medium text-gray-800">{permission.resource}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Action:</span>
                          <span className="font-medium text-gray-800">{permission.action}</span>
                        </div>
                      </div>
                      {permission.description && (
                        <p className="text-sm text-gray-600 mt-2">{permission.description}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      <Modal
        isOpen={showAddRoleModal}
        onClose={() => {
          setShowAddRoleModal(false);
          setNewRole({ name: '', description: '' });
        }}
        title="Add New Role"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Role Name"
            value={newRole.name}
            onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Manager, Viewer"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={newRole.description}
              onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this role's purpose..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddRoleModal(false);
                setNewRole({ name: '', description: '' });
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addRole}
              disabled={!newRole.name.trim()}
            >
              Add Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Roles Modal - Placeholder */}
      <Modal
        isOpen={showEditUserRolesModal}
        onClose={() => {
          setShowEditUserRolesModal(false);
          setSelectedUser(null);
        }}
        title={`Manage Roles - ${selectedUser?.full_name || selectedUser?.email}`}
      >
        <div className="p-6">
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Role Management</h3>
            <p className="text-gray-500">Role assignment functionality coming soon</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};