import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Plus, Edit, Trash2, ChevronRight, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Button, Modal, Input, Card } from '../../../components/Shared/SharedComponents';

interface Crop {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CropClass {
  id: string;
  crop_id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CropSpec {
  id: string;
  class_id: string;
  protein_percent: number | null;
  moisture_percent: number | null;
  other_specs: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CropWithDetails extends Crop {
  classes: (CropClass & { specs: CropSpec[] })[];
}

export const CropManagementTab: React.FC = () => {
  const [crops, setCrops] = useState<CropWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCrops, setExpandedCrops] = useState<Set<string>>(new Set());
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSpecModal, setShowAddSpecModal] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newCrop, setNewCrop] = useState({ name: '', code: '' });
  const [newClass, setNewClass] = useState({ name: '', code: '', description: '' });
  const [newSpec, setNewSpec] = useState({ protein_percent: '', moisture_percent: '', other_specs: '' });
  const [error, setError] = useState<string | null>(null);

  const { error: showError, success: showSuccess } = useNotifications();

  // Load all crops with their classes and specs
  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load crops
      const { data: cropsData, error: cropsError } = await supabase
        .from('master_crops')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (cropsError) throw cropsError;

      // Load classes for each crop
      const cropsWithDetails: CropWithDetails[] = await Promise.all(
        (cropsData || []).map(async (crop) => {
          const { data: classesData, error: classesError } = await supabase
            .from('crop_classes')
            .select('*')
            .eq('crop_id', crop.id)
            .eq('is_active', true)
            .order('name');

          if (classesError) throw classesError;

          // Load specs for each class
          const classesWithSpecs = await Promise.all(
            (classesData || []).map(async (cropClass) => {
              const { data: specsData, error: specsError } = await supabase
                .from('crop_specs')
                .select('*')
                .eq('class_id', cropClass.id)
                .eq('is_active', true)
                .order('protein_percent');

              if (specsError) throw specsError;

              return {
                ...cropClass,
                specs: specsData || []
              };
            })
          );

          return {
            ...crop,
            classes: classesWithSpecs
          };
        })
      );

      setCrops(cropsWithDetails);
      showSuccess('Crops loaded', `Loaded ${cropsWithDetails.length} crops`);
    } catch (err) {
      console.error('Error loading crops:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load crops';
      setError(errorMessage);
      showError('Failed to load crops', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Toggle crop expansion
  const toggleCropExpansion = (cropId: string) => {
    setExpandedCrops(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cropId)) {
        newSet.delete(cropId);
      } else {
        newSet.add(cropId);
      }
      return newSet;
    });
  };

  // Add new crop
  const addCrop = async () => {
    if (!newCrop.name.trim()) return;

    try {
      const { error: insertError } = await supabase
        .from('master_crops')
        .insert({
          name: newCrop.name.trim(),
          code: newCrop.code.trim() || null
        });

      if (insertError) throw insertError;

      showSuccess('Crop added', `${newCrop.name} has been added successfully`);
      setShowAddCropModal(false);
      setNewCrop({ name: '', code: '' });
      loadCrops();
    } catch (err) {
      console.error('Error adding crop:', err);
      showError('Failed to add crop', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Add new class
  const addClass = async () => {
    if (!newClass.name.trim() || !selectedCropId) return;

    try {
      const { error: insertError } = await supabase
        .from('crop_classes')
        .insert({
          crop_id: selectedCropId,
          name: newClass.name.trim(),
          code: newClass.code.trim() || null,
          description: newClass.description.trim() || null
        });

      if (insertError) throw insertError;

      showSuccess('Class added', `${newClass.name} has been added successfully`);
      setShowAddClassModal(false);
      setNewClass({ name: '', code: '', description: '' });
      setSelectedCropId(null);
      loadCrops();
    } catch (err) {
      console.error('Error adding class:', err);
      showError('Failed to add class', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Add new spec
  const addSpec = async () => {
    if (!selectedClassId) return;

    try {
      const specData: any = {
        class_id: selectedClassId,
        protein_percent: newSpec.protein_percent ? parseFloat(newSpec.protein_percent) : null,
        moisture_percent: newSpec.moisture_percent ? parseFloat(newSpec.moisture_percent) : null,
        other_specs: newSpec.other_specs ? JSON.parse(newSpec.other_specs) : null
      };

      const { error: insertError } = await supabase
        .from('crop_specs')
        .insert(specData);

      if (insertError) throw insertError;

      showSuccess('Specification added', 'Crop specification has been added successfully');
      setShowAddSpecModal(false);
      setNewSpec({ protein_percent: '', moisture_percent: '', other_specs: '' });
      setSelectedClassId(null);
      loadCrops();
    } catch (err) {
      console.error('Error adding spec:', err);
      showError('Failed to add specification', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load crops on component mount
  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
              <Wheat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Crop Management</h2>
              <p className="text-gray-600">Manage crops, classes, and specifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadCrops}
              loading={loading}
              icon={RefreshCw}
              variant="outline"
            >
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddCropModal(true)}
              icon={Plus}
            >
              Add Crop
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
                <h3 className="font-medium text-red-800">Error Loading Crops</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-tg-green animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading crops...</p>
            </div>
          </div>
        )}

        {!loading && crops.length === 0 && (
          <div className="text-center py-12">
            <Wheat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No crops found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first crop</p>
            <Button
              onClick={() => setShowAddCropModal(true)}
              icon={Plus}
              size="lg"
            >
              Add First Crop
            </Button>
          </div>
        )}

        {/* Crops List */}
        <div className="space-y-4">
          <AnimatePresence>
            {crops.map((crop) => {
              const isExpanded = expandedCrops.has(crop.id);
              
              return (
                <motion.div
                  key={crop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Crop Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCropExpansion(crop.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                          <Wheat className="w-5 h-5 text-tg-green" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{crop.name}</h3>
                          {crop.code && (
                            <p className="text-sm text-gray-500">Code: {crop.code}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {crop.classes.length} class{crop.classes.length !== 1 ? 'es' : ''}
                        </span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCropId(crop.id);
                            setShowAddClassModal(true);
                          }}
                          size="sm"
                          variant="outline"
                          icon={Plus}
                        >
                          Add Class
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Crop Classes */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 bg-gray-50"
                      >
                        <div className="p-4 space-y-3">
                          {crop.classes.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-gray-500 mb-3">No classes defined for this crop</p>
                              <Button
                                onClick={() => {
                                  setSelectedCropId(crop.id);
                                  setShowAddClassModal(true);
                                }}
                                size="sm"
                                icon={Plus}
                              >
                                Add First Class
                              </Button>
                            </div>
                          ) : (
                            crop.classes.map((cropClass) => (
                              <div key={cropClass.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-medium text-gray-800">{cropClass.name}</h4>
                                    {cropClass.code && (
                                      <p className="text-xs text-gray-500">Code: {cropClass.code}</p>
                                    )}
                                    {cropClass.description && (
                                      <p className="text-sm text-gray-600 mt-1">{cropClass.description}</p>
                                    )}
                                  </div>
                                  <Button
                                    onClick={() => {
                                      setSelectedClassId(cropClass.id);
                                      setShowAddSpecModal(true);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    icon={Plus}
                                  >
                                    Add Spec
                                  </Button>
                                </div>
                                
                                {/* Specifications */}
                                {cropClass.specs.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Specifications</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {cropClass.specs.map((spec) => (
                                        <div key={spec.id} className="bg-gray-50 rounded p-2 text-sm">
                                          {spec.protein_percent && (
                                            <div className="text-gray-700">
                                              <span className="font-medium">Protein:</span> {spec.protein_percent}%
                                            </div>
                                          )}
                                          {spec.moisture_percent && (
                                            <div className="text-gray-700">
                                              <span className="font-medium">Moisture:</span> {spec.moisture_percent}%
                                            </div>
                                          )}
                                          {spec.other_specs && (
                                            <div className="text-gray-600 text-xs mt-1">
                                              {JSON.stringify(spec.other_specs)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
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

      {/* Add Crop Modal */}
      <Modal
        isOpen={showAddCropModal}
        onClose={() => {
          setShowAddCropModal(false);
          setNewCrop({ name: '', code: '' });
        }}
        title="Add New Crop"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Crop Name"
            value={newCrop.name}
            onChange={(e) => setNewCrop(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Wheat, Canola"
            fullWidth
          />
          <Input
            label="Crop Code (Optional)"
            value={newCrop.code}
            onChange={(e) => setNewCrop(prev => ({ ...prev, code: e.target.value }))}
            placeholder="e.g., WHT, CNL"
            fullWidth
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddCropModal(false);
                setNewCrop({ name: '', code: '' });
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addCrop}
              disabled={!newCrop.name.trim()}
            >
              Add Crop
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Class Modal */}
      <Modal
        isOpen={showAddClassModal}
        onClose={() => {
          setShowAddClassModal(false);
          setNewClass({ name: '', code: '', description: '' });
          setSelectedCropId(null);
        }}
        title="Add New Crop Class"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Class Name"
            value={newClass.name}
            onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Canada Western Red Spring"
            fullWidth
          />
          <Input
            label="Class Code (Optional)"
            value={newClass.code}
            onChange={(e) => setNewClass(prev => ({ ...prev, code: e.target.value }))}
            placeholder="e.g., CWRS"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={newClass.description}
              onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this crop class..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddClassModal(false);
                setNewClass({ name: '', code: '', description: '' });
                setSelectedCropId(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addClass}
              disabled={!newClass.name.trim()}
            >
              Add Class
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Spec Modal */}
      <Modal
        isOpen={showAddSpecModal}
        onClose={() => {
          setShowAddSpecModal(false);
          setNewSpec({ protein_percent: '', moisture_percent: '', other_specs: '' });
          setSelectedClassId(null);
        }}
        title="Add New Specification"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Protein Percentage (Optional)"
            type="number"
            step="0.1"
            value={newSpec.protein_percent}
            onChange={(e) => setNewSpec(prev => ({ ...prev, protein_percent: e.target.value }))}
            placeholder="e.g., 13.5"
            fullWidth
          />
          <Input
            label="Moisture Percentage (Optional)"
            type="number"
            step="0.1"
            value={newSpec.moisture_percent}
            onChange={(e) => setNewSpec(prev => ({ ...prev, moisture_percent: e.target.value }))}
            placeholder="e.g., 14.5"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Specifications (JSON, Optional)</label>
            <textarea
              value={newSpec.other_specs}
              onChange={(e) => setNewSpec(prev => ({ ...prev, other_specs: e.target.value }))}
              placeholder='{"test_weight": 78, "falling_number": 300}'
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Enter valid JSON for additional specifications</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddSpecModal(false);
                setNewSpec({ protein_percent: '', moisture_percent: '', other_specs: '' });
                setSelectedClassId(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addSpec}
            >
              Add Specification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};