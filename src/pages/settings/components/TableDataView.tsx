import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Button, Input, Modal, Card } from '../../../components/Shared/SharedComponents';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

interface DatabaseTable {
  table_name: string;
  table_schema: string;
  table_type: string;
  row_count?: number;
  columns?: TableColumn[];
}

interface TableDataViewProps {
  table: DatabaseTable;
  onBack: () => void;
  onRefresh: () => void;
}

export const TableDataView: React.FC<TableDataViewProps> = ({ table, onBack, onRefresh }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState<any>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(['created_at', 'updated_at', 'id']));
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  
  const { error: showError, success: showSuccess } = useNotifications();
  
  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Load table data
  const loadData = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(table.table_name)
        .select('*', { count: 'exact' })
        .range(from, to);

      // Apply search if provided
      if (search && table.columns) {
        const searchableColumns = table.columns
          .filter(col => ['text', 'varchar', 'character varying'].includes(col.data_type.toLowerCase()))
          .map(col => col.column_name);

        if (searchableColumns.length > 0) {
          const searchConditions = searchableColumns
            .map(col => `${col}.ilike.%${search}%`)
            .join(',');
          query = query.or(searchConditions);
        }
      }

      const { data: tableData, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData(tableData || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading table data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      showError('Failed to load data', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [table.table_name, table.columns, showError]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    loadData(1, term);
  }, [loadData]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadData(page, searchTerm);
  };

  // Toggle row selection
  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnName: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  // Handle row edit
  const handleEditRow = (row: any) => {
    setEditingRow({ ...row });
  };

  // Save edited row
  const saveEditedRow = async () => {
    if (!editingRow || !table.columns) return;

    try {
      const primaryKeyColumn = table.columns.find(col => col.is_primary_key);
      if (!primaryKeyColumn) {
        throw new Error('No primary key found for this table');
      }

      const { error: updateError } = await supabase
        .from(table.table_name)
        .update(editingRow)
        .eq(primaryKeyColumn.column_name, editingRow[primaryKeyColumn.column_name]);

      if (updateError) {
        throw updateError;
      }

      showSuccess('Row updated', 'The record has been updated successfully');
      setEditingRow(null);
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Error updating row:', err);
      showError('Failed to update', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Delete selected rows
  const deleteSelectedRows = async () => {
    if (selectedRows.size === 0 || !table.columns) return;

    try {
      const primaryKeyColumn = table.columns.find(col => col.is_primary_key);
      if (!primaryKeyColumn) {
        throw new Error('No primary key found for this table');
      }

      const idsToDelete = Array.from(selectedRows);
      const { error: deleteError } = await supabase
        .from(table.table_name)
        .delete()
        .in(primaryKeyColumn.column_name, idsToDelete);

      if (deleteError) {
        throw deleteError;
      }

      showSuccess('Rows deleted', `${idsToDelete.length} record(s) deleted successfully`);
      setSelectedRows(new Set());
      setShowDeleteModal(false);
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Error deleting rows:', err);
      showError('Failed to delete', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Add new record
  const addNewRecord = async () => {
    if (!table.columns) return;

    try {
      // Filter out empty values and convert types
      const recordToInsert: any = {};
      
      Object.entries(newRecord).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          const column = table.columns?.find(col => col.column_name === key);
          if (column) {
            // Convert boolean strings to actual booleans
            if (column.data_type === 'boolean') {
              recordToInsert[key] = value === 'true';
            } else if (column.data_type.includes('int') || column.data_type === 'numeric') {
              recordToInsert[key] = Number(value);
            } else {
              recordToInsert[key] = value;
            }
          }
        }
      });

      const { error: insertError } = await supabase
        .from(table.table_name)
        .insert(recordToInsert);

      if (insertError) {
        throw insertError;
      }

      showSuccess('Record added', 'The new record has been added successfully');
      setShowAddModal(false);
      setNewRecord({});
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Error adding record:', err);
      showError('Failed to add record', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get visible columns
  const visibleColumns = table.columns?.filter(col => !hiddenColumns.has(col.column_name)) || [];
  const visibleData = data.map(row => {
    const filteredRow: any = {};
    visibleColumns.forEach(col => {
      filteredRow[col.column_name] = row[col.column_name];
    });
    return { ...filteredRow, _originalRow: row };
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              icon={ArrowLeft}
              size="sm"
            >
              Back to Tables
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{table.table_name}</h1>
              <p className="text-gray-600">
                {totalCount.toLocaleString()} records • {table.table_schema} schema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => loadData(currentPage, searchTerm)}
              loading={loading}
              icon={RefreshCw}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              icon={Plus}
              size="sm"
            >
              Add Record
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            />
          </div>
          
          {/* Column Visibility Toggle */}
          <div className="relative">
            <Button
              variant="outline"
              icon={Eye}
              size="sm"
            >
              Columns ({visibleColumns.length})
            </Button>
          </div>

          {selectedRows.size > 0 && (
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="danger"
              icon={Trash2}
              size="sm"
            >
              Delete ({selectedRows.size})
            </Button>
          )}
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
              <RefreshCw className="w-8 h-8 text-tg-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading table data...</p>
            </div>
          </div>
        )}

        {!loading && visibleData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No records found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No records match your search criteria' : 'This table is empty'}
            </p>
          </div>
        )}

        {/* Data Table */}
        {!loading && visibleData.length > 0 && (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === visibleData.length && visibleData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const primaryKeyColumn = table.columns?.find(col => col.is_primary_key);
                            if (primaryKeyColumn) {
                              setSelectedRows(new Set(visibleData.map(row => row._originalRow[primaryKeyColumn.column_name])));
                            }
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                        className="w-4 h-4 text-tg-primary bg-white border-gray-300 rounded focus:ring-tg-primary focus:ring-2"
                      />
                    </th>
                    {visibleColumns.map((column) => (
                      <th key={column.column_name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>{column.column_name}</span>
                          {column.is_primary_key && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              PK
                            </span>
                          )}
                          {column.is_foreign_key && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              FK
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleData.map((row, index) => {
                    const primaryKeyColumn = table.columns?.find(col => col.is_primary_key);
                    const rowId = primaryKeyColumn ? row._originalRow[primaryKeyColumn.column_name] : index;
                    const isSelected = selectedRows.has(rowId);
                    const isEditing = editingRow && editingRow[primaryKeyColumn?.column_name || ''] === rowId;

                    return (
                      <tr key={rowId} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(rowId)}
                            className="w-4 h-4 text-tg-primary bg-white border-gray-300 rounded focus:ring-tg-primary focus:ring-2"
                          />
                        </td>
                        {visibleColumns.map((column) => (
                          <td key={column.column_name} className="px-4 py-3 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingRow[column.column_name] || ''}
                                onChange={(e) => setEditingRow(prev => ({
                                  ...prev,
                                  [column.column_name]: e.target.value
                                }))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-tg-primary"
                              />
                            ) : (
                              <span className="truncate max-w-xs block">
                                {row[column.column_name]?.toString() || '—'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right text-sm">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={saveEditedRow}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRow(null)}
                                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditRow(row._originalRow)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Delete Selected Records</h3>
              <p className="text-gray-600">
                Are you sure you want to delete {selectedRows.size} record(s)? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={deleteSelectedRows}
              variant="danger"
            >
              Delete Records
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewRecord({});
        }}
        title={`Add New Record - ${table.table_name}`}
        size="lg"
      >
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {table.columns
              ?.filter(col => {
                // Filter out auto-generated columns
                const isAutoGenerated = col.column_default?.includes('gen_random_uuid()') || 
                                       col.column_default?.includes('now()') ||
                                       col.column_default?.includes('CURRENT_TIMESTAMP') ||
                                       (col.column_name === 'id' && col.is_primary_key);
                return !isAutoGenerated;
              })
              .map((column) => (
                <div key={column.column_name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.column_name}
                    {column.is_nullable === 'NO' && <span className="text-red-500 ml-1">*</span>}
                    {column.is_primary_key && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        PK
                      </span>
                    )}
                    {column.is_foreign_key && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        FK
                      </span>
                    )}
                  </label>
                  
                  {column.data_type === 'boolean' ? (
                    <select
                      value={newRecord[column.column_name] || ''}
                      onChange={(e) => setNewRecord(prev => ({
                        ...prev,
                        [column.column_name]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : column.data_type.includes('text') || column.data_type.includes('varchar') ? (
                    <textarea
                      value={newRecord[column.column_name] || ''}
                      onChange={(e) => setNewRecord(prev => ({
                        ...prev,
                        [column.column_name]: e.target.value
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent resize-none"
                      placeholder={`Enter ${column.column_name}...`}
                    />
                  ) : (
                    <input
                      type={
                        column.data_type.includes('int') || column.data_type === 'numeric' ? 'number' :
                        column.data_type.includes('date') || column.data_type.includes('timestamp') ? 'datetime-local' :
                        'text'
                      }
                      value={newRecord[column.column_name] || ''}
                      onChange={(e) => setNewRecord(prev => ({
                        ...prev,
                        [column.column_name]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
                      placeholder={`Enter ${column.column_name}...`}
                    />
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {column.data_type} {column.is_nullable === 'NO' ? '(Required)' : '(Optional)'}
                    {column.column_default && ` • Default: ${column.column_default}`}
                  </p>
                </div>
              ))}
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setShowAddModal(false);
                setNewRecord({});
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={addNewRecord}
              icon={Plus}
            >
              Add Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};