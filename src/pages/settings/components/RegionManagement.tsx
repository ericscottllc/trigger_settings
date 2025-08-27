import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Map, Network, Plus } from 'lucide-react';
import { Card } from '../../../components/Shared/SharedComponents';
import { ManageRegions } from './region-management/ManageRegions';
import { ManageElevators } from './region-management/ManageElevators';
import { ManageTowns } from './region-management/ManageTowns';
import { RegionAssociations } from './region-management/RegionAssociations';
import { CreateRegionModal } from './region-management/CreateRegionModal';
import { CreateElevatorModal } from './region-management/CreateElevatorModal';
import { CreateTownModal } from './region-management/CreateTownModal';
import { CreateAssociationModal } from './region-management/CreateAssociationModal';

export type RegionManagementTab = 'regions' | 'elevators' | 'towns' | 'associations';

interface RegionManagementTabConfig {
  id: RegionManagementTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const regionManagementTabs: RegionManagementTabConfig[] = [
  {
    id: 'regions',
    title: 'Regions',
    icon: Map,
    description: 'Manage geographical regions',
    component: ManageRegions
  },
  {
    id: 'elevators',
    title: 'Elevators',
    icon: Building2,
    description: 'Manage grain elevators',
    component: ManageElevators
  },
  {
    id: 'towns',
    title: 'Towns',
    icon: MapPin,
    description: 'Manage towns and locations',
    component: ManageTowns
  },
  {
    id: 'associations',
    title: 'Associations',
    icon: Network,
    description: 'Manage region-elevator-town associations',
    component: RegionAssociations
  }
];

export const RegionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RegionManagementTab>('regions');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeTabConfig = regionManagementTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => null);

  const getCreateModal = () => {
    switch (activeTab) {
      case 'regions':
        return <CreateRegionModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      case 'elevators':
        return <CreateElevatorModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      case 'towns':
        return <CreateTownModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      case 'associations':
        return <CreateAssociationModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Sub-tab Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {regionManagementTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-tg-green text-white shadow-sm'
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
          
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg font-medium text-sm hover:bg-tg-green/90 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Add {activeTabConfig?.title.slice(0, -1) || 'Item'}
          </motion.button>
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
        <ActiveComponent onRefresh={() => {}} />
      </motion.div>
      
      {/* Create Modal */}
      {getCreateModal()}
    </div>
  );
};