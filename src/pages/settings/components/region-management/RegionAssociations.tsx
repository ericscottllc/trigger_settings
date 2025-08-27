import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
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
  crop_classes: { name: string } | null;
}

export const RegionAssociations: React.FC = () => {
  const [associations, setAssociations] = useState<RegionAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
          crop_classes (name)
        `)
        .order('created_at', { ascending: false });

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
  }, []);

  const toggleAssociationStatus = async (associationId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('region_associations')
        .update({ is_active: !currentStatus })
        .eq('id', associationId);

      if (updateError) throw updateError;

      setAssociations(prev => prev.map(association => 
        association.id === associationId ? { ...association, is_active: !currentStatus } : association
      ));

      success('Association updated', `Association ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating association:', err);
      error('Failed to update association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredAssociations = associations.filter(association =>
    association.master_regions.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    association.master_elevators.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    association.master_towns.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (association.master_crop_comparison?.name && association.master_crop_comparison.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (association.crop_classes?.name && association.crop_classes.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <p className="text-sm text-gray-600">{associations.length} total associations</p>
          </div>
        </div>
        <Button variant="secondary" icon={Plus} size="sm">
          Add Association
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search associations by region, elevator, town, or crop..."
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
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tg-green rounded-full flex items-center justify-center">
                    <Network className="w-6 h-6 text-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Region</h4>
                      <p className="text-sm text-gray-900">{association.master_regions.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Elevator</h4>
                      <p className="text-sm text-gray-900">{association.master_elevators.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Town</h4>
                      <p className="text-sm text-gray-900">
                        {association.master_towns.name}
                        {association.master_towns.province && (
                          <span className="text-gray-600">, {association.master_towns.province}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Crop Info</h4>
                      <div className="text-sm text-gray-900">
                        {association.master_crop_comparison && (
                          <p>Comparison: {association.master_crop_comparison.name}</p>
                        )}
                        {association.crop_classes && (
                          <p>Class: {association.crop_classes.name}</p>
                        )}
                        {!association.master_crop_comparison && !association.crop_classes && (
                          <p className="text-gray-500 italic">No crop info</p>
                        )}
                      </div>
                    </div>
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
                      // TODO: Implement edit association modal
                      console.log('Edit association:', association.id);
                    }}
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant={association.is_active ? "danger" : "secondary"}
                    size="sm"
                    icon={association.is_active ? Trash2 : Plus}
                    onClick={() => toggleAssociationStatus(association.id, association.is_active)}
                  >
                    {association.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredAssociations.length === 0 && (
        <Card className="p-8 text-center">
          <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No associations found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No region associations have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};