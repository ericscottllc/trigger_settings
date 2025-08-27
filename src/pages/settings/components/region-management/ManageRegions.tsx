import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
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

export const ManageRegions: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
        <Button variant="secondary" icon={Plus} size="sm">
          Add Region
        </Button>
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
                  onClick={() => {
                    // TODO: Implement edit region modal
                    console.log('Edit region:', region.id);
                  }}
                  fullWidth
                >
                  Edit
                </Button>
                
                <Button
                  variant={region.is_active ? "danger" : "secondary"}
                  size="sm"
                  icon={region.is_active ? Trash2 : Plus}
                  onClick={() => toggleRegionStatus(region.id, region.is_active)}
                  fullWidth
                >
                  {region.is_active ? 'Deactivate' : 'Activate'}
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
    </div>
  );
};