import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface Region {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditRegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: Region | null;
  onSave: () => void;
}

const EditRegionModal: React.FC<EditRegionModalProps> = ({ isOpen, onClose, region, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const { success, error } = useNotifications();

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name,
        code: region.code || ''
      });
    }
  }, [region]);

  const handleSave = async () => {
    if (!region || !formData.name.trim()) return;

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from('master_regions')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim() || null
        })
        .eq('id', region.id);

      if (updateError) throw updateError;

      success('Region updated', 'Region has been updated successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating region:', err);
      error('Failed to update region', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Region">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Region Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
            placeholder="Enter region name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Region Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
            placeholder="Enter region code (optional)"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={handleSave} loading={loading}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const ManageRegions: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const { success, error } = useNotifications();

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('master_regions')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setRegions(data || []);
    } catch (err) {
      console.error('Error fetching regions:', err);
      error('Failed to load regions', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const toggleRegionStatus = async (regionId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('master_regions')
        .update({ is_active: !currentStatus })
        .eq('id', regionId);

      if (updateError) throw updateError;

      setRegions(prev => prev.map(region => 
        region.id === regionId ? { ...region, is_active: !currentStatus } : region
      ));

      success('Region updated', `Region ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating region:', err);
      error('Failed to update region', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteRegion = async (regionId: string) => {
    if (!confirm('Are you sure you want to delete this region? This action cannot be undone.')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('master_regions')
        .delete()
        .eq('id', regionId);

      if (deleteError) throw deleteError;

      setRegions(prev => prev.filter(region => region.id !== regionId));
      success('Region deleted', 'Region has been deleted successfully');
    } catch (err) {
      console.error('Error deleting region:', err);
      error('Failed to delete region', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (region.code && region.code.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <Map className="w-6 h-6 text-tg-green" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Region Management</h2>
            <p className="text-sm text-gray-600">{regions.length} total regions</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search regions by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegions.map((region, index) => (
          <motion.div
            key={region.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tg-green rounded-lg flex items-center justify-center">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{region.name}</h3>
                    {region.code && (
                      <p className="text-sm text-gray-600 font-mono">{region.code}</p>
                    )}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  region.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {region.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => setEditingRegion(region)}
                  fullWidth
                >
                  Edit
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => deleteRegion(region.id)}
                  fullWidth
                >
                  Delete
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRegions.length === 0 && (
        <Card className="p-8 text-center">
          <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No regions found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No regions have been created yet'}
          </p>
        </Card>
      )}

      {/* Edit Modal */}
      <EditRegionModal
        isOpen={!!editingRegion}
        onClose={() => setEditingRegion(null)}
        region={editingRegion}
        onSave={fetchRegions}
      />
    </div>
  );
};