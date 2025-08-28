import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Plus, Edit, Trash2, Search, ChevronDown, ChevronRight, MapPin, Building2, Wheat, Layers, Link } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

// Types for the new structure
interface ElevatorTown {
  id: string;
  elevator_id: string;
  town_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  master_elevators: { name: string };
  master_towns: { name: string; province: string | null };
}

interface TownRegion {
  id: string;
  town_id: string;
  region_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  master_towns: { name: string; province: string | null };
  master_regions: { name: string };
}

interface RegionCropComparison {
  id: string;
  region_id: string;
  crop_comparison_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  master_regions: { name: string };
  master_crop_comparison: { name: string };
}

interface ElevatorCrop {
  id: string;
  elevator_id: string;
  crop_id: string;
  sort_order: number;
  is_active: boolean;
  master_elevators: { name: string };
  master_crops: { name: string };
}

interface ElevatorCropClass {
  id: string;
  elevator_id: string;
  class_id: string;
  sort_order: number;
  is_active: boolean;
  master_elevators: { name: string };
  crop_classes: { name: string; master_crops: { name: string } };
}

type AssociationType = 'elevator-town' | 'town-region' | 'region-crop-comparison' | 'elevator-crop' | 'elevator-crop-class';

interface CreateAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AssociationType;
  onSave: () => void;
}

const CreateAssociationModal: React.FC<CreateAssociationModalProps> = ({ isOpen, onClose, type, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any>({});
  const [formData, setFormData] = useState<any>({});
  const { success, error } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      resetForm();
    }
  }, [isOpen, type]);

  const resetForm = () => {
    switch (type) {
      case 'elevator-town':
        setFormData({ elevator_id: '', town_id: '', valid_from: new Date().toISOString().split('T')[0] });
        break;
      case 'town-region':
        setFormData({ town_id: '', region_id: '', valid_from: new Date().toISOString().split('T')[0] });
        break;
      case 'region-crop-comparison':
        setFormData({ region_id: '', crop_comparison_id: '', valid_from: new Date().toISOString().split('T')[0] });
        break;
      case 'elevator-crop':
        setFormData({ elevator_id: '', crop_id: '', sort_order: 0 });
        break;
      case 'elevator-crop-class':
        setFormData({ elevator_id: '', class_id: '', sort_order: 0 });
        break;
    }
  };

  const fetchOptions = async () => {
    try {
      const promises = [];
      
      if (type.includes('elevator')) {
        promises.push(supabase.from('master_elevators').select('*').eq('is_active', true).order('name'));
      }
      if (type.includes('town')) {
        promises.push(supabase.from('master_towns').select('*').eq('is_active', true).order('name'));
      }
      if (type.includes('region')) {
        promises.push(supabase.from('master_regions').select('*').eq('is_active', true).order('name'));
      }
      if (type.includes('crop-comparison')) {
        promises.push(supabase.from('master_crop_comparison').select('*').eq('is_active', true).order('name'));
      }
      if (type.includes('crop') && !type.includes('comparison')) {
        promises.push(supabase.from('master_crops').select('*').eq('is_active', true).order('name'));
      }
      if (type.includes('crop-class')) {
        promises.push(supabase.from('crop_classes').select('*, master_crops(name)').eq('is_active', true).order('name'));
      }

      const results = await Promise.all(promises);
      const newOptions: any = {};
      
      let index = 0;
      if (type.includes('elevator')) newOptions.elevators = results[index++]?.data || [];
      if (type.includes('town')) newOptions.towns = results[index++]?.data || [];
      if (type.includes('region')) newOptions.regions = results[index++]?.data || [];
      if (type.includes('crop-comparison')) newOptions.cropComparisons = results[index++]?.data || [];
      if (type.includes('crop') && !type.includes('comparison')) newOptions.crops = results[index++]?.data || [];
      if (type.includes('crop-class')) newOptions.cropClasses = results[index++]?.data || [];

      setOptions(newOptions);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      let tableName = '';
      let insertData = { ...formData };

      switch (type) {
        case 'elevator-town':
          tableName = 'elevator_towns';
          break;
        case 'town-region':
          tableName = 'town_regions';
          break;
        case 'region-crop-comparison':
          tableName = 'region_crop_comparisons';
          break;
        case 'elevator-crop':
          tableName = 'elevator_crops';
          break;
        case 'elevator-crop-class':
          tableName = 'elevator_crop_classes';
          break;
      }

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(insertData);

      if (insertError) throw insertError;

      success('Association created', 'New association has been created successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error creating association:', err);
      error('Failed to create association', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'elevator-town': return 'Link Elevator to Town';
      case 'town-region': return 'Link Town to Region';
      case 'region-crop-comparison': return 'Link Region to Crop Comparison';
      case 'elevator-crop': return 'Link Elevator to Crop';
      case 'elevator-crop-class': return 'Link Elevator to Crop Class';
      default: return 'Create Association';
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'elevator-town':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elevator *</label>
              <select
                value={formData.elevator_id}
                onChange={(e) => setFormData({ ...formData, elevator_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Elevator</option>
                {options.elevators?.map((elevator: any) => (
                  <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Town *</label>
              <select
                value={formData.town_id}
                onChange={(e) => setFormData({ ...formData, town_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Town</option>
                {options.towns?.map((town: any) => (
                  <option key={town.id} value={town.id}>
                    {town.name}{town.province && `, ${town.province}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
              />
            </div>
          </>
        );
      
      case 'town-region':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Town *</label>
              <select
                value={formData.town_id}
                onChange={(e) => setFormData({ ...formData, town_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Town</option>
                {options.towns?.map((town: any) => (
                  <option key={town.id} value={town.id}>
                    {town.name}{town.province && `, ${town.province}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
              <select
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Region</option>
                {options.regions?.map((region: any) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
              />
            </div>
          </>
        );

      case 'region-crop-comparison':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
              <select
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Region</option>
                {options.regions?.map((region: any) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop Comparison *</label>
              <select
                value={formData.crop_comparison_id}
                onChange={(e) => setFormData({ ...formData, crop_comparison_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Crop Comparison</option>
                {options.cropComparisons?.map((comparison: any) => (
                  <option key={comparison.id} value={comparison.id}>{comparison.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
              />
            </div>
          </>
        );

      case 'elevator-crop':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elevator *</label>
              <select
                value={formData.elevator_id}
                onChange={(e) => setFormData({ ...formData, elevator_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Elevator</option>
                {options.elevators?.map((elevator: any) => (
                  <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop *</label>
              <select
                value={formData.crop_id}
                onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Crop</option>
                {options.crops?.map((crop: any) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                min="0"
              />
            </div>
          </>
        );

      case 'elevator-crop-class':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elevator *</label>
              <select
                value={formData.elevator_id}
                onChange={(e) => setFormData({ ...formData, elevator_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Elevator</option>
                {options.elevators?.map((elevator: any) => (
                  <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop Class *</label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select Crop Class</option>
                {options.cropClasses?.map((cropClass: any) => (
                  <option key={cropClass.id} value={cropClass.id}>
                    {cropClass.master_crops?.name} - {cropClass.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                min="0"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="md">
      <div className="p-6 space-y-4">
        {renderForm()}
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={handleSave} loading={loading}>
            Create Association
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const ManageAssociations: React.FC = () => {
  const [activeAssociationType, setActiveAssociationType] = useState<AssociationType>('elevator-town');
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { success, error } = useNotifications();

  const associationTypes = [
    { id: 'elevator-town', title: 'Elevator ↔ Town', icon: Link, color: 'bg-blue-500' },
    { id: 'town-region', title: 'Town ↔ Region', icon: MapPin, color: 'bg-green-500' },
    { id: 'region-crop-comparison', title: 'Region ↔ Crop Comparison', icon: Wheat, color: 'bg-yellow-500' },
    { id: 'elevator-crop', title: 'Elevator ↔ Crop', icon: Building2, color: 'bg-purple-500' },
    { id: 'elevator-crop-class', title: 'Elevator ↔ Crop Class', icon: Layers, color: 'bg-red-500' }
  ];

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      let query;
      
      switch (activeAssociationType) {
        case 'elevator-town':
          query = supabase
            .from('elevator_towns')
            .select('*, master_elevators(name), master_towns(name, province)')
            .order('created_at', { ascending: false });
          break;
        case 'town-region':
          query = supabase
            .from('town_regions')
            .select('*, master_towns(name, province), master_regions(name)')
            .order('created_at', { ascending: false });
          break;
        case 'region-crop-comparison':
          query = supabase
            .from('region_crop_comparisons')
            .select('*, master_regions(name), master_crop_comparison(name)')
            .order('created_at', { ascending: false });
          break;
        case 'elevator-crop':
          query = supabase
            .from('elevator_crops')
            .select('*, master_elevators(name), master_crops(name)')
            .order('sort_order', { ascending: true });
          break;
        case 'elevator-crop-class':
          query = supabase
            .from('elevator_crop_classes')
            .select('*, master_elevators(name), crop_classes(name, master_crops(name))')
            .order('sort_order', { ascending: true });
          break;
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setAssociations(data || []);
    } catch (err) {
      console.error('Error fetching associations:', err);
      error('Failed to load associations', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, [activeAssociationType]);

  const toggleAssociationStatus = async (id: string, currentStatus: boolean) => {
    try {
      const tableName = activeAssociationType.replace('-', '_');
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchAssociations();
      success('Association updated', `Association ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating association:', err);
      error('Failed to update association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteAssociation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this association?')) return;
    
    try {
      const tableName = activeAssociationType.replace('-', '_');
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchAssociations();
      success('Association deleted', 'Association has been deleted successfully');
    } catch (err) {
      console.error('Error deleting association:', err);
      error('Failed to delete association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const renderAssociationCard = (association: any) => {
    const getDisplayText = () => {
      switch (activeAssociationType) {
        case 'elevator-town':
          return {
            primary: association.master_elevators?.name || 'Unknown Elevator',
            secondary: `${association.master_towns?.name || 'Unknown Town'}${association.master_towns?.province ? `, ${association.master_towns.province}` : ''}`,
            tertiary: association.valid_from ? `Valid from: ${new Date(association.valid_from).toLocaleDateString()}` : null
          };
        case 'town-region':
          return {
            primary: association.master_towns?.name || 'Unknown Town',
            secondary: association.master_regions?.name || 'Unknown Region',
            tertiary: association.valid_from ? `Valid from: ${new Date(association.valid_from).toLocaleDateString()}` : null
          };
        case 'region-crop-comparison':
          return {
            primary: association.master_regions?.name || 'Unknown Region',
            secondary: association.master_crop_comparison?.name || 'Unknown Comparison',
            tertiary: association.valid_from ? `Valid from: ${new Date(association.valid_from).toLocaleDateString()}` : null
          };
        case 'elevator-crop':
          return {
            primary: association.master_elevators?.name || 'Unknown Elevator',
            secondary: association.master_crops?.name || 'Unknown Crop',
            tertiary: `Sort order: ${association.sort_order}`
          };
        case 'elevator-crop-class':
          return {
            primary: association.master_elevators?.name || 'Unknown Elevator',
            secondary: association.crop_classes ? `${association.crop_classes.master_crops?.name} - ${association.crop_classes.name}` : 'Unknown Class',
            tertiary: `Sort order: ${association.sort_order}`
          };
        default:
          return { primary: 'Unknown', secondary: '', tertiary: null };
      }
    };

    const displayText = getDisplayText();
    const activeType = associationTypes.find(t => t.id === activeAssociationType);

    return (
      <Card key={association.id} className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${activeType?.color} rounded-lg flex items-center justify-center`}>
              {activeType?.icon && <activeType.icon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{displayText.primary}</h4>
              <p className="text-sm text-gray-600">{displayText.secondary}</p>
              {displayText.tertiary && (
                <p className="text-xs text-gray-500 mt-1">{displayText.tertiary}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              association.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {association.is_active ? 'Active' : 'Inactive'}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => {
                // TODO: Implement edit modal
                console.log('Edit association:', association.id);
              }}
            >
              Edit
            </Button>
            
            <Button
              variant={association.is_active ? "danger" : "secondary"}
              size="sm"
              onClick={() => toggleAssociationStatus(association.id, association.is_active)}
            >
              {association.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => deleteAssociation(association.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const filteredAssociations = associations.filter(association => {
    const searchLower = searchTerm.toLowerCase();
    switch (activeAssociationType) {
      case 'elevator-town':
        return (association.master_elevators?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_towns?.name || '').toLowerCase().includes(searchLower);
      case 'town-region':
        return (association.master_towns?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_regions?.name || '').toLowerCase().includes(searchLower);
      case 'region-crop-comparison':
        return (association.master_regions?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_crop_comparison?.name || '').toLowerCase().includes(searchLower);
      case 'elevator-crop':
        return (association.master_elevators?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_crops?.name || '').toLowerCase().includes(searchLower);
      case 'elevator-crop-class':
        return (association.master_elevators?.name || '').toLowerCase().includes(searchLower) ||
               (association.crop_classes?.name || '').toLowerCase().includes(searchLower) ||
               (association.crop_classes?.master_crops?.name || '').toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-tg-green" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage Associations</h2>
            <p className="text-sm text-gray-600">Manage relationships between different entities</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
          className="bg-tg-green hover:bg-tg-green/90"
        >
          Add Association
        </Button>
      </div>

      {/* Association Type Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {associationTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeAssociationType === type.id;
            
            return (
              <motion.button
                key={type.id}
                onClick={() => setActiveAssociationType(type.id as AssociationType)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-tg-green text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span>{type.title}</span>
              </motion.button>
            );
          })}
        </div>
        
        <Input
          icon={Search}
          placeholder={`Search ${associationTypes.find(t => t.id === activeAssociationType)?.title.toLowerCase()} associations...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Associations List */}
      <div className="grid gap-4">
        {filteredAssociations.map((association, index) => (
          <motion.div
            key={association.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {renderAssociationCard(association)}
          </motion.div>
        ))}
      </div>

      {filteredAssociations.length === 0 && (
        <Card className="p-8 text-center">
          <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No associations found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : `No ${associationTypes.find(t => t.id === activeAssociationType)?.title.toLowerCase()} associations have been created yet`}
          </p>
        </Card>
      )}

      {/* Create Modal */}
      <CreateAssociationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        type={activeAssociationType}
        onSave={() => {
          fetchAssociations();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};