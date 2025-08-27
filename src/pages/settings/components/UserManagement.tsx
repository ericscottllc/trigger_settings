import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Shield, Key } from 'lucide-react';
import { Card } from '../../../components/Shared/SharedComponents';
import { AssignRoles } from './user-management/AssignRoles';
import { ManagePermissions } from './user-management/ManagePermissions';
import { ManageRoles } from './user-management/ManageRoles';
import { UserList } from './user-management/UserList';

export type UserManagementTab = 'users' | 'roles' | 'permissions' | 'assign-roles';

interface UserManagementTabConfig {
  id: UserManagementTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const userManagementTabs: UserManagementTabConfig[] = [
  {
    id: 'users',
    title: 'Users',
    icon: Users,
    description: 'View and manage user accounts',
    component: UserList
  },
  {
    id: 'roles',
    title: 'Roles',
    icon: Shield,
    description: 'Create and manage user roles',
    component: ManageRoles
  },
  {
    id: 'permissions',
    title: 'Permissions',
    icon: Key,
    description: 'Define system permissions',
    component: ManagePermissions
  },
  {
    id: 'assign-roles',
    title: 'Assign Roles',
    icon: UserCheck,
    description: 'Assign roles to users',
    component: AssignRoles
  }
];

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserManagementTab>('users');

  const activeTabConfig = userManagementTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => null);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Sub-tab Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {userManagementTabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-tg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </motion.button>
            );
          })}
        </div>
        
        {activeTabConfig && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">{activeTabConfig.description}</p>
          </div>
        )}
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ActiveComponent />
      </motion.div>
    </div>
  );
};