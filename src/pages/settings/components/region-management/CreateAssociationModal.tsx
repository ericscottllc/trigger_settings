import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface CreateAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAssociationModal: React.FC<CreateAssociationModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [elevators, setElevators] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [cropComparisons, setCropComparisons] = useState<any[]>([]);
  const [cropClasses, setCropClasses] = useState<any[]>([]);
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
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.region_id || !formData.elevator_id || !formData.town_id) return;

    try {
      setLoading(true);
      
      const { error: insertError } = await supabase
        .from('region_associations')
        .insert({
          region_id: formData.region_id,
          elevator_id: formData.elevator_id,
          town_id: formData.town_id,
          crop_comparison_id: formData.crop_comparison_id || null,
          class_id: formData.class_id || null
        });

      if (insertError) throw insertError;

      success('Association created', 'New association has been created successfully');
      setFormData({
        region_id: '',
        elevator_id: '',
        town_id: '',
        crop_comparison_id: '',
        class_id: ''
      });
      onClose();
    } catch (err) {
      console.error('Error creating association:', err);
      error('Failed to create association', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      region_id: '',
      elevator_id: '',
      town_id: '',
      crop_comparison_id: '',
      class_id: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Association" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            type="submit" 
            loading={loading}
            disabled={!formData.region_id || !formData.elevator_id || !formData.town_id}
          >
            Create Association
          </Button>
        </div>
      </form>
    </Modal>
  );
};