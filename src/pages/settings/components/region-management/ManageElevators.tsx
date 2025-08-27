import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../../../components/Shared/SharedComponents';
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

interface EditElevatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  elevator: Elevator | null;
  onSave: () => void;
}

const EditElevatorModal: React.FC<EditElevatorModalProps> = ({ isOpen, onClose, elevator, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const { success, error } = useNotifications();

  useEffect(() => {
    if (elevator) {
      setFormData({
        name: elevator.name,
        code: elevator.code || ''
      });
    }
  }, [elevator]);

  const handleSave = async () => {
    if (!elevator || !formData.name.trim()) return;

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from('master_elevators')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim() || null
        })
        .eq('id', elevator.id);

      if (updateError) throw updateError;

      success('Elevator updated', 'Elevator has been updated successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating elevator:', err);
      error('Failed to update elevator', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Elevator">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
            placeholder="Enter elevator name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
            placeholder="Enter elevator code (optional)"
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

export const ManageElevators: React.FC = () => {
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingElevator, setEditingElevator] = useState<Elevator | null>(null);
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

  const deleteElevator = async (elevatorId: string) => {
    if (!confirm('Are you sure you want to delete this elevator? This action cannot be undone.')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('master_elevators')
        .delete()
        .eq('id', elevatorId);

      if (deleteError) throw deleteError;

      setElevators(prev => prev.filter(elevator => elevator.id !== elevatorId));
      success('Elevator deleted', 'Elevator has been deleted successfully');
    } catch (err) {
      console.error('Error deleting elevator:', err);
      error('Failed to delete elevator', err instanceof Error ? err.message : 'Unknown error');
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
                  onClick={() => setEditingElevator(elevator)}
                  fullWidth
                >
                  Edit
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => deleteElevator(elevator.id)}
                  fullWidth
                >
                  Delete
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

      {/* Edit Modal */}
      <EditElevatorModal
        isOpen={!!editingElevator}
        onClose={() => setEditingElevator(null)}
        elevator={editingElevator}
        onSave={fetchElevators}
      />
    </div>
  );
};