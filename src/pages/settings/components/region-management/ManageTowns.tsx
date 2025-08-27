import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface Town {
  id: string;
  name: string;
  province: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManageTowns: React.FC = () => {
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchTowns = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('master_towns')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setTowns(data || []);
    } catch (err) {
      console.error('Error fetching towns:', err);
      error('Failed to load towns', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTowns();
  }, []);

  const toggleTownStatus = async (townId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('master_towns')
        .update({ is_active: !currentStatus })
        .eq('id', townId);

      if (updateError) throw updateError;

      setTowns(prev => prev.map(town => 
        town.id === townId ? { ...town, is_active: !currentStatus } : town
      ));

      success('Town updated', `Town ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating town:', err);
      error('Failed to update town', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredTowns = towns.filter(town =>
    town.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (town.province && town.province.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group towns by province
  const groupedTowns = filteredTowns.reduce((acc, town) => {
    const province = town.province || 'No Province';
    if (!acc[province]) {
      acc[province] = [];
    }
    acc[province].push(town);
    return acc;
  }, {} as Record<string, Town[]>);

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
          <MapPin className="w-6 h-6 text-tg-green" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Town Management</h2>
            <p className="text-sm text-gray-600">{towns.length} total towns</p>
          </div>
        </div>
        <Button variant="secondary" icon={Plus} size="sm">
          Add Town
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search towns by name or province..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Towns List - Grouped by Province */}
      <div className="space-y-6">
        {Object.entries(groupedTowns).map(([province, provinceTowns]) => (
          <div key={province}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-tg-green" />
              <h3 className="text-lg font-semibold text-gray-800">{province}</h3>
              <span className="px-2 py-1 bg-tg-green/10 text-tg-green text-xs font-medium rounded-full">
                {provinceTowns.length} towns
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {provinceTowns.map((town, index) => (
                <motion.div
                  key={town.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-tg-green rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{town.name}</h4>
                          {town.province && (
                            <p className="text-sm text-gray-600">{town.province}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        town.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {town.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                          // TODO: Implement edit town modal
                          console.log('Edit town:', town.id);
                        }}
                        fullWidth
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant={town.is_active ? "danger" : "secondary"}
                        size="sm"
                        icon={town.is_active ? Trash2 : Plus}
                        onClick={() => toggleTownStatus(town.id, town.is_active)}
                        fullWidth
                      >
                        {town.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTowns.length === 0 && (
        <Card className="p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No towns found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No towns have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};