import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, RefreshCw, AlertCircle, Building, MapIcon, Wheat } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Button, Modal, Input, Card } from '../../../components/Shared/SharedComponents';

interface Region {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RegionAssociation {
  id: string;
  region_id: string;
  elevator_id: string;
  town_id: string;
  crop_id: string;
  crop_comparison_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  region_name?: string;
  elevator_name?: string;
  town_name?: string;
  crop_name?: string;
  comparison_name?: string;
}

interface MasterData {
  elevators: Array<{ id: string; name: string }>;
  towns: Array<{ id: string; name: string }>;
  crops: Array<{ id: string; name: string }>;
  comparisons: Array<{ id: string; name: string }>;
}

export const RegionManagementTab: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [associations, setAssociations] = useState<RegionAssociation[]>([]);
  const [masterData, setMasterData] = useState<MasterData>({
    elevators: [],
    towns: [],
    crops: [],
    comparisons: []
  });
  const [loading, setLoading] = useState(false);
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showAddAssociationModal, setShowAddAssociationModal] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [newRegion, setNewRegion] = useState({ name: '', code: '' });
  const [newAssociation, setNewAssociation] = useState({
    region_id: '',
    elevator_id: '',
    town_id: '',
    crop_id: '',
    crop_comparison_id: ''
  });
  const [error, setError] = useState<string | null>(null);

  const { error: showError, success: showSuccess } = useNotifications();

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('master_regions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (regionsError) throw regionsError;

      // Load associations with joined data
      const { data: associationsData, error: associationsError } = await supabase
        .from('region_associations')
        .select(`
          *,
          master_regions!inner(name),
          master_elevators!inner(name),
          master_towns!inner(name),
          master_crops!inner(name),
          master_crop_comparison(name)
        `)
        .eq('is_active', true);

      if (associationsError) throw associationsError;

      // Load master data for dropdowns
      const [elevatorsRes, townsRes, cropsRes, comparisonsRes] = await Promise.all([
        supabase.from('master_elevators').select('id, name').eq('is_active', true).order('name'),
        supabase.from('master_towns').select('id, name').eq('is_active', true).order('name'),
        supabase.from('master_crops').select('id, name').eq('is_active', true).order('name'),
        supabase.from('master_crop_comparison').select('id, name').eq('is_active', true).order('name')
      ]);

      if (elevatorsRes.error) throw elevatorsRes.error;
      if (townsRes.error) throw townsRes.error;
      if (cropsRes.error) throw cropsRes.error;
      if (comparisonsRes.error) throw comparisonsRes.error;

      // Format associations data
      const formattedAssociations = (associationsData || []).map((assoc: any) => ({
        ...assoc,
        region_name: assoc.master_regions?.name,
        elevator_name: assoc.master_elevators?.name,
        town_name: assoc.master_towns?.name,
        crop_name: assoc.master_crops?.name,
        comparison_name: assoc.master_crop_comparison?.name
      }));

      setRegions(regionsData || []);
      setAssociations(formattedAssociations);
      setMasterData({
        elevators: elevatorsRes.data || [],
        towns: townsRes.data || [],
        crops: cropsRes.data || [],
        comparisons: comparisonsRes.data || []
      });

      showSuccess('Data loaded', `Loaded ${regionsData?.length || 0} regions and ${formattedAssociations.length} associations`);
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      showError('Failed to load data', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Add new region
  const addRegion = async () => {
    if (!newRegion.name.trim()) return;

    try {
      const { error: insertError } = await supabase
        .from('master_regions')
        .insert({
          name: newRegion.name.trim(),
          code: newRegion.code.trim() || null
        });

      if (insertError) throw insertError;

      showSuccess('Region added', `${newRegion.name} has been added successfully`);
      setShowAddRegionModal(false);
      setNewRegion({ name: '', code: '' });
      loadData();
    } catch (err) {
      console.error('Error adding region:', err);
      showError('Failed to add region', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Add new association
  const addAssociation = async () => {
    const { region_id, elevator_id, town_id, crop_id, crop_comparison_id } = newAssociation;
    
    if (!region_id || !elevator_id || !town_id || !crop_id) {
      showError('Missing fields', 'Please fill in all required fields');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('region_associations')
        .insert({
          region_id,
          elevator_id,
          town_id,
          crop_id,
          crop_comparison_id: crop_comparison_id || null
        });

      if (insertError) throw insertError;

      showSuccess('Association added', 'Region association has been added successfully');
      setShowAddAssociationModal(false);
      setNewAssociation({
        region_id: '',
        elevator_id: '',
        town_id: '',
        crop_id: '',
        crop_comparison_id: ''
      });
      loadData();
    } catch (err) {
      console.error('Error adding association:', err);
      showError('Failed to add association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Delete association
  const deleteAssociation = async (associationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('region_associations')
        .update({ is_active: false })
        .eq('id', associationId);

      if (deleteError) throw deleteError;

      showSuccess('Association deleted', 'Association has been removed successfully');
      loadData();
    } catch (err) {
      console.error('Error deleting association:', err);
      showError('Failed to delete association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get associations for a specific region
  const getRegionAssociations = (regionId: string) => {
    return associations.filter(assoc => assoc.region_id === regionId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tg-coral rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Region Management</h2>
              <p className="text-gray-600">Manage regions and their associations</p>
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
            <Button
              onClick={() => setShowAddRegionModal(true)}
              icon={Plus}
            >
              Add Region
            </Button>
          </div>
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
              <RefreshCw className="w-8 h-8 text-tg-coral animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading regions and associations...</p>
            </div>
          </div>
        )}

        {!loading && regions.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No regions found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first region</p>
            <Button
              onClick={() => setShowAddRegionModal(true)}
              icon={Plus}
              size="lg"
            >
              Add First Region
            </Button>
          </div>
        )}

        {/* Regions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {regions.map((region) => {
              const regionAssociations = getRegionAssociations(region.id);
              
              return (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Region Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-tg-coral rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{region.name}</h3>
                          {region.code && (
                            <p className="text-sm text-gray-500">Code: {region.code}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {regionAssociations.length} association{regionAssociations.length !== 1 ? 's' : ''}
                        </span>
                        <Button
                          onClick={() => {
                            setSelectedRegionId(region.id);
                            setNewAssociation(prev => ({ ...prev, region_id: region.id }));
                            setShowAddAssociationModal(true);
                          }}
                          size="sm"
                          variant="outline"
                          icon={Plus}
                        >
                          Add Association
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Associations */}
                  <div className="p-4">
                    {regionAssociations.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-3">No associations defined for this region</p>
                        <Button
                          onClick={() => {
                            setSelectedRegionId(region.id);
                            setNewAssociation(prev => ({ ...prev, region_id: region.id }));
                            setShowAddAssociationModal(true);
                          }}
                          size="sm"
                          icon={Plus}
                        >
                          Add First Association
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {regionAssociations.map((association) => (
                          <div key={association.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-700">Elevator:</span>
                                  <span className="text-gray-600">{association.elevator_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapIcon className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-700">Town:</span>
                                  <span className="text-gray-600">{association.town_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Wheat className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-700">Crop:</span>
                                  <span className="text-gray-600">{association.crop_name}</span>
                                </div>
                                {association.comparison_name && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Comparison:</span>
                                    <span className="text-gray-600">{association.comparison_name}</span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteAssociation(association.id)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Delete association"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Region Modal */}
      <Modal
        isOpen={showAddRegionModal}
        onClose={() => {
          setShowAddRegionModal(false);
          setNewRegion({ name: '', code: '' });
        }}
        title="Add New Region"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Region Name"
            value={newRegion.name}
            onChange={(e) => setNewRegion(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Western Saskatchewan"
            fullWidth
          />
          <Input
            label="Region Code (Optional)"
            value={newRegion.code}
            onChange={(e) => setNewRegion(prev => ({ ...prev, code: e.target.value }))}
            placeholder="e.g., WSK"
            fullWidth
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddRegionModal(false);
                setNewRegion({ name: '', code: '' });
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addRegion}
              disabled={!newRegion.name.trim()}
            >
              Add Region
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Association Modal */}
      <Modal
        isOpen={showAddAssociationModal}
        onClose={() => {
          setShowAddAssociationModal(false);
          setNewAssociation({
            region_id: '',
            elevator_id: '',
            town_id: '',
            crop_id: '',
            crop_comparison_id: ''
          });
          setSelectedRegionId(null);
        }}
        title="Add New Association"
        size="lg"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={newAssociation.region_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, region_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Region...</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Elevator *</label>
            <select
              value={newAssociation.elevator_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, elevator_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Elevator...</option>
              {masterData.elevators.map((elevator) => (
                <option key={elevator.id} value={elevator.id}>
                  {elevator.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Town *</label>
            <select
              value={newAssociation.town_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, town_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Town...</option>
              {masterData.towns.map((town) => (
                <option key={town.id} value={town.id}>
                  {town.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop *</label>
            <select
              value={newAssociation.crop_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, crop_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Crop...</option>
              {masterData.crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Comparison (Optional)</label>
            <select
              value={newAssociation.crop_comparison_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, crop_comparison_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Comparison...</option>
              {masterData.comparisons.map((comparison) => (
                <option key={comparison.id} value={comparison.id}>
                  {comparison.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddAssociationModal(false);
                setNewAssociation({
                  region_id: '',
                  elevator_id: '',
                  town_id: '',
                  crop_id: '',
                  crop_comparison_id: ''
                });
                setSelectedRegionId(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addAssociation}
              disabled={!newAssociation.region_id || !newAssociation.elevator_id || !newAssociation.town_id || !newAssociation.crop_id}
            >
              Add Association
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};