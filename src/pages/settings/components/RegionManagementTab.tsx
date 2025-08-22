import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, RefreshCw, AlertCircle, Building, MapIcon, Wheat, ChevronDown, ChevronRight, Table } from 'lucide-react';
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
  class_id: string;
  crop_comparison_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  region_name?: string;
  elevator_name?: string;
  town_name?: string;
  class_name?: string;
  crop_name?: string;
  comparison_name?: string;
}

interface ComparisonGroup {
  comparison_id: string;
  comparison_name: string;
  regions: Array<{
    region_id: string;
    region_name: string;
    associations: RegionAssociation[];
  }>;
}

interface MasterData {
  elevators: Array<{ id: string; name: string }>;
  towns: Array<{ id: string; name: string }>;
  cropClasses: Array<{ id: string; name: string; crop_name: string }>;
  comparisons: Array<{ id: string; name: string }>;
}

export const RegionManagementTab: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [associations, setAssociations] = useState<RegionAssociation[]>([]);
  const [comparisonGroups, setComparisonGroups] = useState<ComparisonGroup[]>([]);
  const [masterData, setMasterData] = useState<MasterData>({
    elevators: [],
    towns: [],
    cropClasses: [],
    comparisons: []
  });
  const [loading, setLoading] = useState(false);
  const [expandedComparisons, setExpandedComparisons] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showAddAssociationModal, setShowAddAssociationModal] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [newRegion, setNewRegion] = useState({ name: '', code: '' });
  const [newAssociation, setNewAssociation] = useState({
    region_id: '',
    elevator_id: '',
    town_id: '',
    class_id: '',
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
          crop_classes!inner(name, master_crops!inner(name)),
          master_crop_comparison(name)
        `)
        .eq('is_active', true);

      if (associationsError) throw associationsError;

      // Load master data for dropdowns
      const [elevatorsRes, townsRes, cropClassesRes, comparisonsRes] = await Promise.all([
        supabase.from('master_elevators').select('id, name').eq('is_active', true).order('name'),
        supabase.from('master_towns').select('id, name').eq('is_active', true).order('name'),
        supabase.from('crop_classes').select('id, name, master_crops!inner(name)').eq('is_active', true).order('name'),
        supabase.from('master_crop_comparison').select('id, name').eq('is_active', true).order('name')
      ]);

      if (elevatorsRes.error) throw elevatorsRes.error;
      if (townsRes.error) throw townsRes.error;
      if (cropClassesRes.error) throw cropClassesRes.error;
      if (comparisonsRes.error) throw comparisonsRes.error;

      // Format associations data
      const formattedAssociations = (associationsData || []).map((assoc: any) => ({
        ...assoc,
        region_name: assoc.master_regions?.name,
        elevator_name: assoc.master_elevators?.name,
        town_name: assoc.master_towns?.name,
        class_name: assoc.crop_classes?.name,
        crop_name: assoc.crop_classes?.master_crops?.name,
        comparison_name: assoc.master_crop_comparison?.name
      }));

      // Group associations by comparison and region
      const groupedData: ComparisonGroup[] = [];
      const comparisonMap = new Map<string, ComparisonGroup>();

      formattedAssociations.forEach((assoc: RegionAssociation) => {
        const comparisonKey = assoc.crop_comparison_id || 'no-comparison';
        const comparisonName = assoc.comparison_name || 'No Comparison';
        
        if (!comparisonMap.has(comparisonKey)) {
          comparisonMap.set(comparisonKey, {
            comparison_id: comparisonKey,
            comparison_name: comparisonName,
            regions: []
          });
        }
        
        const comparisonGroup = comparisonMap.get(comparisonKey)!;
        let regionGroup = comparisonGroup.regions.find(r => r.region_id === assoc.region_id);
        
        if (!regionGroup) {
          regionGroup = {
            region_id: assoc.region_id,
            region_name: assoc.region_name || '',
            associations: []
          };
          comparisonGroup.regions.push(regionGroup);
        }
        
        regionGroup.associations.push(assoc);
      });

      // Convert map to array and sort
      const sortedGroups = Array.from(comparisonMap.values()).sort((a, b) => 
        a.comparison_name.localeCompare(b.comparison_name)
      );

      // Sort regions within each group
      sortedGroups.forEach(group => {
        group.regions.sort((a, b) => a.region_name.localeCompare(b.region_name));
      });

      setRegions(regionsData || []);
      setAssociations(formattedAssociations);
      setComparisonGroups(sortedGroups);
      setMasterData({
        elevators: elevatorsRes.data || [],
        towns: townsRes.data || [],
        cropClasses: (cropClassesRes.data || []).map(cc => ({
          id: cc.id,
          name: `${cc.master_crops.name} - ${cc.name}`,
          crop_name: cc.master_crops.name
        })),
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

  // Toggle comparison expansion
  const toggleComparisonExpansion = (comparisonId: string) => {
    setExpandedComparisons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(comparisonId)) {
        newSet.delete(comparisonId);
      } else {
        newSet.add(comparisonId);
      }
      return newSet;
    });
  };

  // Toggle region expansion
  const toggleRegionExpansion = (regionKey: string) => {
    setExpandedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regionKey)) {
        newSet.delete(regionKey);
      } else {
        newSet.add(regionKey);
      }
      return newSet;
    });
  };

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
    const { region_id, elevator_id, town_id, class_id, crop_comparison_id } = newAssociation;
    
    if (!region_id || !elevator_id || !town_id || !class_id) {
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
          class_id,
          crop_comparison_id: crop_comparison_id || null
        });

      if (insertError) throw insertError;

      showSuccess('Association added', 'Region association has been added successfully');
      setShowAddAssociationModal(false);
      setNewAssociation({
        region_id: '',
        elevator_id: '',
        town_id: '',
        class_id: '',
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

        {!loading && comparisonGroups.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No region associations found</h3>
            <p className="text-gray-500 mb-6">Start by adding regions and creating associations</p>
            <Button
              onClick={() => setShowAddRegionModal(true)}
              icon={Plus}
              size="lg"
            >
              Add First Region
            </Button>
          </div>
        )}

        {/* Comparison Groups */}
        <div className="space-y-4">
          <AnimatePresence>
            {comparisonGroups.map((comparisonGroup) => {
              const isComparisonExpanded = expandedComparisons.has(comparisonGroup.comparison_id);
              const totalAssociations = comparisonGroup.regions.reduce((sum, region) => sum + region.associations.length, 0);

              return (
                <motion.div
                  key={comparisonGroup.comparison_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                >
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    onClick={() => toggleComparisonExpansion(comparisonGroup.comparison_id)}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isComparisonExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="w-8 h-8 bg-tg-primary rounded-lg flex items-center justify-center">
                            <Wheat className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{comparisonGroup.comparison_name}</h3>
                          <p className="text-sm text-gray-500">
                            {comparisonGroup.regions.length} region{comparisonGroup.regions.length !== 1 ? 's' : ''} • {totalAssociations} association{totalAssociations !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Regions within Comparison */}
                  <AnimatePresence>
                    {isComparisonExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4 space-y-3">
                          {comparisonGroup.regions.map((regionGroup) => {
                            const regionKey = `${comparisonGroup.comparison_id}-${regionGroup.region_id}`;
                            const isRegionExpanded = expandedRegions.has(regionKey);

                            return (
                              <div key={regionKey} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                {/* Region Header */}
                                <div
                                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                                  onClick={() => toggleRegionExpansion(regionKey)}
                                >
                                  <div className="flex items-center gap-2">
                                    {isRegionExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                    <MapPin className="w-4 h-4 text-tg-coral" />
                                    <span className="font-medium text-gray-800">{regionGroup.region_name}</span>
                                    <span className="text-sm text-gray-500">
                                      ({regionGroup.associations.length} location{regionGroup.associations.length !== 1 ? 's' : ''})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRegionId(regionGroup.region_id);
                                        setNewAssociation(prev => ({ 
                                          ...prev, 
                                          region_id: regionGroup.region_id,
                                          crop_comparison_id: comparisonGroup.comparison_id === 'no-comparison' ? '' : comparisonGroup.comparison_id
                                        }));
                                        setShowAddAssociationModal(true);
                                      }}
                                      size="sm"
                                      variant="outline"
                                      icon={Plus}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>

                                {/* Region Associations Table */}
                                <AnimatePresence>
                                  {isRegionExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-gray-200 bg-white"
                                    >
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Town</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {regionGroup.associations.map((association) => (
                                              <tr key={association.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-gray-900">{association.elevator_name}</td>
                                                <td className="px-3 py-2 text-gray-900">{association.town_name}</td>
                                                <td className="px-3 py-2 text-gray-600">{association.crop_name}</td>
                                                <td className="px-3 py-2 text-gray-600">{association.class_name}</td>
                                                <td className="px-3 py-2 text-center">
                                                  <button
                                                    onClick={() => deleteAssociation(association.id)}
                                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                                    title="Delete association"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
            class_id: '',
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Class *</label>
            <select
              value={newAssociation.class_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, class_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Crop Class...</option>
              {masterData.cropClasses.map((cropClass) => (
                <option key={cropClass.id} value={cropClass.id}>
                  {cropClass.name}
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
                  class_id: '',
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
              disabled={!newAssociation.region_id || !newAssociation.elevator_id || !newAssociation.town_id || !newAssociation.class_id}
            >
              Add Association
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
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
            class_id: '',
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Class *</label>
            <select
              value={newAssociation.class_id}
              onChange={(e) => setNewAssociation(prev => ({ ...prev, class_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">Select Crop Class...</option>
              {masterData.cropClasses.map((cropClass) => (
                <option key={cropClass.id} value={cropClass.id}>
                  {cropClass.name}
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
                  class_id: '',
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
              disabled={!newAssociation.region_id || !newAssociation.elevator_id || !newAssociation.town_id || !newAssociation.class_id}
            >
              Add Association
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};