import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Plus, Edit, Trash2, Search, ChevronDown, ChevronRight, MapPin, Building2, Wheat, Layers } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface RegionAssociation {
  id: string;
  region_id: string;
  elevator_id: string;
  town_id: string;
  crop_comparison_id: string | null;
  class_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_regions: { name: string };
  master_elevators: { name: string };
  master_towns: { name: string; province: string | null };
  master_crop_comparison: { name: string } | null;
  crop_classes: { name: string; master_crops: { name: string } } | null;
}

interface Region {
  id: string;
  name: string;
  associations: RegionAssociation[];
}

interface EditAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  association: RegionAssociation | null;
  onSave: () => void;
}

const EditAssociationModal: React.FC<EditAssociationModalProps> = ({ isOpen, onClose, association, onSave }) => {
  const [regions, setRegions] = useState<any[]>([]);
  const [elevators, setElevators] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [cropComparisons, setCropComparisons] = useState<any[]>([]);
  const [cropClasses, setCropClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    region_id: '',
    elevator_id: '',
    town_id: '',
    crop_comparison_id: '',
    class_id: ''
  });
  const { success, error } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (association) {
        setFormData({
          region_id: association.region_id,
          elevator_id: association.elevator_id,
          town_id: association.town_id,
          crop_comparison_id: association.crop_comparison_id || '',
          class_id: association.class_id || ''
        });
      }
    }
  }, [isOpen, association]);

  const fetchOptions = async () => {
    try {
      const [regionsRes, elevatorsRes, townsRes, comparisonsRes, classesRes] = await Promise.all([
        supabase.from('master_regions').select('*').eq('is_active', true).order('name'),
        supabase.from('master_elevators').select('*').eq('is_active', true).order('name'),
        supabase.from('master_towns').select('*').eq('is_active', true).order('name'),
        supabase.from('master_crop_comparison').select('*').eq('is_active', true).order('name'),
        supabase.from('crop_classes').select('*, master_crops(name)').eq('is_active', true).order('name')
      ]);

      setRegions(regionsRes.data || []);
      setElevators(elevatorsRes.data || []);
      setTowns(townsRes.data || []);
      setCropComparisons(comparisonsRes.data || []);
      setCropClasses(classesRes.data || []);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        region_id: formData.region_id,
        elevator_id: formData.elevator_id,
        town_id: formData.town_id,
        crop_comparison_id: formData.crop_comparison_id || null,
        class_id: formData.class_id || null
      };

      const { error: updateError } = await supabase
        .from('region_associations')
        .update(updateData)
        .eq('id', association!.id);

      if (updateError) throw updateError;

      success('Association updated', 'Association has been updated successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating association:', err);
      error('Failed to update association', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Association" size="lg">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
            <select
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
              required
            >
              <option value="">Select Region</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Elevator *</label>
            <select
              value={formData.elevator_id}
              onChange={(e) => setFormData({ ...formData, elevator_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
              required
            >
              <option value="">Select Elevator</option>
              {elevators.map(elevator => (
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
              {towns.map(town => (
                <option key={town.id} value={town.id}>
                  {town.name}{town.province && `, ${town.province}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Comparison</label>
            <select
              value={formData.crop_comparison_id}
              onChange={(e) => setFormData({ ...formData, crop_comparison_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
            >
              <option value="">Select Comparison (Optional)</option>
              {cropComparisons.map(comparison => (
                <option key={comparison.id} value={comparison.id}>{comparison.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Class</label>
            <select
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
            >
              <option value="">Select Class (Optional)</option>
              {cropClasses.map(cropClass => (
                <option key={cropClass.id} value={cropClass.id}>
                  {cropClass.master_crops?.name} - {cropClass.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            variant="secondary" 
            onClick={handleSave} 
            loading={loading}
            disabled={!formData.region_id || !formData.elevator_id || !formData.town_id}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const RegionAssociations: React.FC = () => {
  const [associations, setAssociations] = useState<RegionAssociation[]>([]);
  const [groupedAssociations, setGroupedAssociations] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [editingAssociation, setEditingAssociation] = useState<RegionAssociation | null>(null);
  const { success, error } = useNotifications();

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('region_associations')
        .select(`
          *,
          master_regions (name),
          master_elevators (name),
          master_towns (name, province),
          master_crop_comparison (name),
          crop_classes (name, master_crops (name))
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAssociations(data || []);
      
      // Group associations by region
      const grouped = (data || []).reduce((acc: Region[], association) => {
        const regionName = association.master_regions.name;
        let region = acc.find(r => r.name === regionName);
        
        if (!region) {
          region = {
            id: association.region_id,
            name: regionName,
            associations: []
          };
          acc.push(region);
        }
        
        region.associations.push(association);
        return acc;
      }, []);
      
      setGroupedAssociations(grouped);
    } catch (err) {
      console.error('Error fetching associations:', err);
      error('Failed to load associations', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, []);

  const toggleAssociationStatus = async (associationId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('region_associations')
        .update({ is_active: !currentStatus })
        .eq('id', associationId);

      if (updateError) throw updateError;

      await fetchAssociations();
      success('Association updated', `Association ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating association:', err);
      error('Failed to update association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteAssociation = async (associationId: string) => {
    if (!confirm('Are you sure you want to delete this association?')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('region_associations')
        .delete()
        .eq('id', associationId);

      if (deleteError) throw deleteError;

      await fetchAssociations();
      success('Association deleted', 'Association has been deleted successfully');
    } catch (err) {
      console.error('Error deleting association:', err);
      error('Failed to delete association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const toggleRegionExpansion = (regionId: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionId)) {
      newExpanded.delete(regionId);
    } else {
      newExpanded.add(regionId);
    }
    setExpandedRegions(newExpanded);
  };

  const filteredRegions = groupedAssociations.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.associations.some(assoc =>
      assoc.master_elevators.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assoc.master_towns.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assoc.master_crop_comparison?.name && assoc.master_crop_comparison.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assoc.crop_classes?.name && assoc.crop_classes.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

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
            <h2 className="text-xl font-semibold text-gray-800">Region Associations</h2>
            <p className="text-sm text-gray-600">{associations.length} total associations across {groupedAssociations.length} regions</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search by region, elevator, town, or crop..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Regions List */}
      <div className="space-y-4">
        {filteredRegions.map((region, index) => {
          const isExpanded = expandedRegions.has(region.id);
          
          return (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                {/* Region Header */}
                <div 
                  className="p-4 bg-tg-green/5 border-b border-tg-green/10 cursor-pointer hover:bg-tg-green/10 transition-colors"
                  onClick={() => toggleRegionExpansion(region.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-tg-green" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-tg-green" />
                      )}
                      <div className="w-10 h-10 bg-tg-green rounded-lg flex items-center justify-center">
                        <Network className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{region.name}</h3>
                        <p className="text-sm text-gray-600">{region.associations.length} associations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-tg-green/20 text-tg-green text-sm font-medium rounded-full">
                        {region.associations.filter(a => a.is_active).length} active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Associations List */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="divide-y divide-gray-100"
                  >
                    {region.associations.map((association) => (
                      <div key={association.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{association.master_elevators.name}</p>
                                <p className="text-xs text-gray-500">Elevator</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{association.master_towns.name}</p>
                                <p className="text-xs text-gray-500">
                                  {association.master_towns.province || 'Town'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Wheat className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {association.master_crop_comparison?.name || 'No comparison'}
                                </p>
                                <p className="text-xs text-gray-500">Crop Comparison</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {association.crop_classes ? 
                                    `${association.crop_classes.master_crops?.name} - ${association.crop_classes.name}` : 
                                    'No class'
                                  }
                                </p>
                                <p className="text-xs text-gray-500">Crop Class</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
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
                              onClick={() => setEditingAssociation(association)}
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
                      </div>
                    ))}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredRegions.length === 0 && (
        <Card className="p-8 text-center">
          <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No associations found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No region associations have been created yet'}
          </p>
        </Card>
      )}

      {/* Edit Modal */}
      <EditAssociationModal
        isOpen={!!editingAssociation}
        onClose={() => setEditingAssociation(null)}
        association={editingAssociation}
        onSave={fetchAssociations}
      />
    </div>
  );
};