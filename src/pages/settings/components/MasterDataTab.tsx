import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Table, RefreshCw, AlertCircle, Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Button } from '../../../components/Shared/SharedComponents';
import { TableDataView } from './TableDataView';

interface DatabaseTable {
  table_name: string;
  table_schema: string;
  table_type: string;
  row_count?: number;
  columns?: TableColumn[];
}

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

export const MasterDataTab: React.FC = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { error: showError, success: showSuccess } = useNotifications();

  // Load all tables in the public schema
  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get table information
      const { data: tablesData, error: tablesError } = await supabase.rpc('get_schema_tables');
      
      if (tablesError) {
        throw tablesError;
      }

      // Get row counts for each table
      const tablesWithCounts = await Promise.all(
        (tablesData || []).map(async (table: any) => {
          try {
            const { count, error: countError } = await supabase
              .from(table.table_name)
              .select('*', { count: 'exact', head: true });
            
            return {
              ...table,
              row_count: countError ? 0 : count || 0
            };
          } catch {
            return {
              ...table,
              row_count: 0
            };
          }
        })
      );

      setTables(tablesWithCounts);
      showSuccess('Tables loaded successfully', `Found ${tablesWithCounts.length} tables`);
    } catch (err) {
      console.error('Error loading tables:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tables';
      setError(errorMessage);
      showError('Failed to load tables', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Load table columns when a table is selected
  const loadTableColumns = useCallback(async (tableName: string) => {
    try {
      const { data: columnsData, error: columnsError } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      });

      if (columnsError) {
        throw columnsError;
      }

      setSelectedTable(prev => prev ? {
        ...prev,
        columns: columnsData || []
      } : null);
    } catch (err) {
      console.error('Error loading table columns:', err);
      showError('Failed to load table structure', 'Could not retrieve column information');
    }
  }, [showError]);

  // Handle table selection
  const handleTableSelect = (table: DatabaseTable) => {
    setSelectedTable(table);
    loadTableColumns(table.table_name);
  };

  // Filter tables based on search term
  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load tables on component mount
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  if (selectedTable) {
    return (
      <TableDataView
        table={selectedTable}
        onBack={() => setSelectedTable(null)}
        onRefresh={() => loadTableColumns(selectedTable.table_name)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tg-primary rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Master Data</h2>
              <p className="text-gray-600">Manage system tables and reference data</p>
            </div>
          </div>
          <Button
            onClick={loadTables}
            loading={loading}
            icon={RefreshCw}
            variant="outline"
          >
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredTables.length} of {tables.length} tables
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error Loading Tables</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-tg-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading database tables...</p>
            </div>
          </div>
        )}

        {!loading && filteredTables.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No tables found</h3>
            <p className="text-gray-500">No tables match your search criteria</p>
          </div>
        )}

        {!loading && filteredTables.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No tables available</h3>
            <p className="text-gray-500">No tables found in the public schema</p>
          </div>
        )}

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTables.map((table, index) => (
              <motion.div
                key={table.table_name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handleTableSelect(table)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-6">
                  {/* Table Icon and Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-tg-green rounded-xl flex items-center justify-center group-hover:bg-tg-primary transition-colors">
                      <Table className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {table.table_name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {table.table_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rows</span>
                      <span className="font-medium text-gray-800">
                        {table.row_count?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Schema</span>
                      <span className="font-medium text-gray-800">
                        {table.table_schema}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>Click to view data</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};