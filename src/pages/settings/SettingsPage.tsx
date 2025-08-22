import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Database, Users, Bell, Shield, Palette } from 'lucide-react';
import { MasterDataTab } from './components/MasterDataTab';

export type SettingsTab = 'master-data' | 'users' | 'notifications' | 'security' | 'appearance';

interface SettingsTabConfig {
  id: SettingsTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const settingsTabs: SettingsTabConfig[] = [
  {
    id: 'master-data',
    title: 'Master Data',
    icon: Database,
    description: 'Manage system tables and reference data',
    component: MasterDataTab
  },
  {
    id: 'users',
    title: 'User Management',
    icon: Users,
    description: 'Manage user accounts and permissions',
    component: () => <div className="p-6 text-gray-500">User Management - Coming Soon</div>
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Configure system notifications and alerts',
    component: () => <div className="p-6 text-gray-500">Notifications - Coming Soon</div>
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    description: 'Security settings and access controls',
    component: () => <div className="p-6 text-gray-500">Security - Coming Soon</div>
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel',
    component: () => <div className="p-6 text-gray-500">Appearance - Coming Soon</div>
  }
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('master-data');

  const activeTabConfig = settingsTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => null);

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-tg-primary rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Settings</h1>
                <p className="text-sm text-gray-500">System configuration</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 space-y-2">
            {settingsTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-tg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={!isActive ? { x: 4 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex-shrink-0 p-1 rounded-lg ${
                    isActive ? 'bg-white/20' : ''
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">{tab.title}</h3>
                    <p className={`text-xs leading-relaxed ${
                      isActive ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ActiveComponent />
          </motion.div>
        </div>
      </div>
    </div>
  );
};