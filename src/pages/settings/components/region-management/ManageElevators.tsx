import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface Elevator {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManageElevators: React.FC = () => {
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchElevators = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('master_elevators')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setElevators(data || []);
    } catch (err) {
      console.error('Error fetching elevators:', err);
      error('Failed to load elevators', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElevators();
  }, []);

  const toggleElevatorStatus = async (elevatorId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('master_elevators')
        .update({ is_active: !currentStatus })
        .eq('id', elevatorId);

      if (updateError) throw updateError;

      setElevators(prev => prev.map(elevator => 
        elevator.id === elevatorId ? { ...elevator, is_active: !currentStatus } : elevator
      ));

      success('Elevator updated', `Elevator ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating elevator:', err);
      error('Failed to update elevator', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredElevators = elevators.filter(elevator =>
    elevator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (elevator.code && elevator.code.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <Building2 className="w-6 h-6 text-tg-green" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Elevator Management</h2>
            <p className="text-sm text-gray-600">{elevators.length} total elevators</p>
          </div>
        </div>
        <Button variant="secondary" icon={Plus} size="sm">
          Add Elevator
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search elevators by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Elevators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredElevators.map((elevator, index) => (
          <motion.div
            key={elevator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tg-green rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{elevator.name}</h3>
                    {elevator.code && (
                      <p className="text-sm text-gray-600 font-mono">{elevator.code}</p>
                    )}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  elevator.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {elevator.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => {
                    // TODO: Implement edit elevator modal
                    console.log('Edit elevator:', elevator.id);
                  }}
                  fullWidth
                >
                  Edit
                </Button>
                
                <Button
                  variant={elevator.is_active ? "danger" : "secondary"}
                  size="sm"
                  icon={elevator.is_active ? Trash2 : Plus}
                  onClick={() => toggleElevatorStatus(elevator.id, elevator.is_active)}
                  fullWidth
                >
                  {elevator.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredElevators.length === 0 && (
        <Card className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No elevators found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No elevators have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};