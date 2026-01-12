//src\pages\common\RecycleBinPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';

// Stylish Icons with consistent styling
const RestoreIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-20 h-20 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BinIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

// Modern Delete Confirmation Modal
const DeleteConfirmationModal = ({ itemName, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-teal-900/20 backdrop-blur-sm flex justify-center items-center z-50 p-4"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="bg-gradient-to-br from-teal-50/95 to-mint-50/95 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-teal-100"
    >
      <div className="p-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-coral-50 to-coral-100 mb-6">
          <svg className="h-8 w-8 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-teal-900 text-center mb-2">Permanently Delete?</h3>
        <p className="text-teal-700 text-center mb-2">
          You're about to permanently delete
        </p>
        <div className="bg-coral-50 border border-coral-100 rounded-lg p-4 mb-6">
          <p className="text-coral-800 font-semibold text-center truncate">
            "{itemName}"
          </p>
        </div>
        <p className="text-sm text-teal-600 text-center mb-6">
          This action cannot be undone. All data will be lost permanently.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-teal-100 hover:bg-teal-200 text-teal-800 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-coral-400 to-coral-500 hover:from-coral-500 hover:to-coral-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Delete Forever
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// Tab Configuration - merged inventory into one tab
const TAB_CONFIG = {
  maternal: {
    label: 'Maternal Records',
    color: 'seafoam',
    icon: '👩',
    table: 'patients'
  },
  child: {
    label: 'Child Records',
    color: 'sky',
    icon: '👶',
    table: 'child_records'
  },
  inventory: {
    label: 'Inventory Items',
    color: 'lavender',
    icon: '📦',
    tables: ['inventory', 'bns_inventory'] // Both inventory tables in one tab
  }
};

// Color mapping for eye-friendly palette
const COLOR_CLASSES = {
  seafoam: {
    bg: 'bg-sky-50',
    hover: 'hover:bg-seafoam-100',
    text: 'text-seafoam-700',
    border: 'border-seafoam-200',
    gradientFrom: 'from-seafoam-100',
    gradientTo: 'to-seafoam-200',
    dot: 'bg-sky-400'
  },
  sky: {
    bg: 'bg-sky-50',
    hover: 'hover:bg-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-200',
    gradientFrom: 'from-sky-100',
    gradientTo: 'to-sky-200',
    dot: 'bg-sky-400'
  },
  lavender: {
    bg: 'bg-sky-50',
    hover: 'hover:bg-lavender-100',
    text: 'text-lavender-700',
    border: 'border-lavender-200',
    gradientFrom: 'from-lavender-100',
    gradientTo: 'to-lavender-200',
    dot: 'bg-sky-400'
  }
};

// Inventory Source Badge Component
const InventorySourceBadge = ({ table }) => {
  const config = {
    inventory: {
      label: 'BHW',
      bgColor: 'bg-seafoam-100',
      textColor: 'text-seafoam-800',
      borderColor: 'border-seafoam-200',
      icon: '🏥'
    },
    bns_inventory: {
      label: 'BNS',
      bgColor: 'bg-lavender-100',
      textColor: 'text-lavender-800',
      borderColor: 'border-lavender-200',
      icon: '🥗'
    }
  };

  const badgeConfig = config[table] || {
    label: 'Inventory',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: '📦'
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs">{badgeConfig.icon}</span>
      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.borderColor}`}>
        {badgeConfig.label}
      </span>
    </div>
  );
};

export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState('maternal');
  const [deletedRecords, setDeletedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { addNotification } = useNotification();

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    
    try {
      if (activeTab === 'inventory') {
        // Fetch from both inventory tables
        const [bhwInventory, bnsInventory] = await Promise.all([
          supabase
            .from('inventory')
            .select('*')
            .eq('is_deleted', true)
            .order('deleted_at', { ascending: false }),
          
          supabase
            .from('bns_inventory')
            .select('*')
            .eq('is_deleted', true)
            .order('deleted_at', { ascending: false })
        ]);

        const bhwData = bhwInventory.data || [];
        const bnsData = bnsInventory.data || [];

        // Add source table information and normalize data
        const combinedInventory = [
          ...bhwData.map(item => ({
            ...item,
            source_table: 'inventory',
            source_label: 'BHW',
            source_icon: '🏥'
          })),
          ...bnsData.map(item => ({
            ...item,
            source_table: 'bns_inventory',
            source_label: 'BNS',
            source_icon: '🥗'
          }))
        ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

        setDeletedRecords(combinedInventory);
      } else {
        // Fetch from single table for maternal or child records
        const { table } = TAB_CONFIG[activeTab];
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('is_deleted', true)
          .order('deleted_at', { ascending: false });

        if (error) throw error;
        
        const recordsWithTable = (data || []).map(record => ({
          ...record,
          source_table: table
        }));
        setDeletedRecords(recordsWithTable);
      }
    } catch (error) {
      console.error("Error fetching trash:", error);
      addNotification('Failed to load deleted items', 'error');
    }
    
    setLoading(false);
  }, [activeTab, addNotification]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const getDisplayName = (record) => {
    if (activeTab === 'inventory') {
      return record.item_name || 'Unnamed Item';
    }
    return `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Unnamed Record';
  };

  const getDisplayID = (record) => {
    if (activeTab === 'inventory') {
      return record.sku || record.batch_no || 'No ID';
    }
    return activeTab === 'maternal' ? record.patient_id : record.child_id;
  };

  const getCategoryInfo = (record) => {
    if (activeTab === 'inventory') {
      const category = record.category || 'Uncategorized';
      const quantity = record.quantity !== undefined ? `${record.quantity} ${record.unit || ''}`.trim() : null;
      return { category, quantity };
    }
    return { category: null, quantity: null };
  };

  const handleRestore = async (id, name, sourceTable) => {
    const { error } = await supabase
      .from(sourceTable)
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);

    if (error) {
      addNotification(`Error restoring: ${error.message}`, 'error');
    } else {
      addNotification(`${name} restored successfully`, 'success');
      logActivity('Record Restored', `Restored ${name} from trash.`);
      fetchDeleted();
    }
  };

  const executePermanentDelete = async () => {
    if (!itemToDelete) return;
    const { id, source_table } = itemToDelete;
    const name = getDisplayName(itemToDelete);
    
    const { error } = await supabase
      .from(source_table)
      .delete()
      .eq('id', id);

    if (error) {
      addNotification(`Error deleting: ${error.message}`, 'error');
    } else {
      addNotification(`${name} permanently deleted`, 'success');
      logActivity('Record Permanently Deleted', `Permanently deleted ${name}.`);
      fetchDeleted();
    }
    setItemToDelete(null);
  };

  // Calculate stats for inventory tab
  const inventoryStats = useCallback(() => {
    if (activeTab !== 'inventory') return null;
    
    const bhwCount = deletedRecords.filter(r => r.source_table === 'inventory').length;
    const bnsCount = deletedRecords.filter(r => r.source_table === 'bns_inventory').length;
    
    return { bhwCount, bnsCount, total: bhwCount + bnsCount };
  }, [deletedRecords, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 to-sky-50/30 p-6">
      <AnimatePresence>
        {itemToDelete && (
          <DeleteConfirmationModal 
            itemName={getDisplayName(itemToDelete)} 
            onConfirm={executePermanentDelete} 
            onCancel={() => setItemToDelete(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl shadow-lg">
            <BinIcon />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-900">Recycle Bin</h1>
            <p className="text-teal-600">Manage and restore deleted items</p>
          </div>
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-teal-400 to-teal-200 rounded-full mt-2"></div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-1 mb-6">
          <div className="flex flex-wrap gap-1">
            {Object.entries(TAB_CONFIG).map(([key, { label, color, icon }]) => {
              const colorClasses = COLOR_CLASSES[color];
              const isActive = activeTab === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 py-3 px-5 font-semibold rounded-xl transition-all duration-300 ${
                    isActive
                      ? `${colorClasses.bg} ${colorClasses.text} shadow-inner border ${colorClasses.border}`
                      : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50/50'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                  {isActive && (
                    <span className={`ml-2 h-2 w-2 rounded-full ${colorClasses.dot}`}></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-teal-400 to-teal-500 text-white p-5 rounded-2xl shadow-lg">
            <div className="text-sm text-teal-100 mb-1">Total Deleted</div>
            <div className="text-3xl font-bold">{deletedRecords.length}</div>
          </div>
          
          {activeTab === 'inventory' ? (
            <>
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100">
                <div className="text-sm text-teal-600 mb-1">BHW Items</div>
                <div className="text-xl font-semibold text-seafoam-700">
                  {inventoryStats()?.bhwCount || 0}
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100">
                <div className="text-sm text-teal-600 mb-1">BNS Items</div>
                <div className="text-xl font-semibold text-lavender-700">
                  {inventoryStats()?.bnsCount || 0}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100 col-span-2">
              <div className="text-sm text-teal-600 mb-1">Current Category</div>
              <div className="text-xl font-semibold text-teal-800">
                {TAB_CONFIG[activeTab].label}
              </div>
            </div>
          )}
          
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100">
            <div className="text-sm text-teal-600 mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
              <span className="text-sm font-medium text-teal-800">
                {loading ? 'Loading...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-100 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
            <p className="text-teal-600">Loading deleted items...</p>
          </div>
        ) : deletedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16">
            <EmptyIcon />
            <p className="mt-6 text-teal-400 text-lg font-medium">Trash is empty</p>
            <p className="text-teal-300 text-sm mt-2">No deleted items in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-teal-50/80 to-teal-100/80 border-b border-teal-200">
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Deleted Date
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    ID / SKU
                  </th>
                  {activeTab === 'inventory' && (
                    <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                      Source
                    </th>
                  )}
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    {activeTab === 'inventory' ? 'Item Details' : 'Name / Record'}
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100/50">
                {deletedRecords.map((record) => {
                  const { category, quantity } = getCategoryInfo(record);
                  
                  return (
                    <motion.tr
                      key={`${record.source_table}-${record.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-teal-50/50 transition-colors duration-200"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            record.source_table === 'inventory' ? 'bg-seafoam-400' : 
                            record.source_table === 'bns_inventory' ? 'bg-lavender-400' : 
                            'bg-coral-400'
                          }`}></div>
                          <div className="flex flex-col">
                            <span className="text-teal-700 text-sm">
                              {record.deleted_at
                                ? new Date(record.deleted_at).toLocaleDateString()
                                : 'N/A'}
                            </span>
                            <span className="text-teal-400 text-xs">
                              {record.deleted_at
                                ? new Date(record.deleted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-lg">
                          {getDisplayID(record)}
                        </span>
                      </td>
                      {activeTab === 'inventory' && (
                        <td className="p-4">
                          <InventorySourceBadge table={record.source_table} />
                        </td>
                      )}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-teal-900">
                            {getDisplayName(record)}
                          </div>
                          
                          {activeTab === 'inventory' && (
                            <div className="space-y-1">
                              {category && (
                                <div className="flex items-center gap-2 text-sm text-teal-600">
                                  <span className="text-xs">📁</span>
                                  <span>{category}</span>
                                </div>
                              )}
                              {quantity && (
                                <div className="flex items-center gap-2 text-sm text-teal-600">
                                  <span className="text-xs">⚖️</span>
                                  <span>{quantity}</span>
                                </div>
                              )}
                              {record.expiration_date || record.expiry_date ? (
                                <div className="flex items-center gap-2 text-sm text-teal-600">
                                  <span className="text-xs">📅</span>
                                  <span>Exp: {new Date(record.expiration_date || record.expiry_date).toLocaleDateString()}</span>
                                </div>
                              ) : null}
                            </div>
                          )}
                          
                          {activeTab === 'maternal' && record.purok && (
                            <div className="text-sm text-teal-600">
                              Purok {record.purok}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleRestore(record.id, getDisplayName(record), record.source_table)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-800 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-md border border-emerald-200"
                          >
                            <RestoreIcon />
                            Restore
                          </button>
                          <button
                            onClick={() => setItemToDelete(record)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coral-50 to-coral-100 hover:from-coral-100 hover:to-coral-200 text-coral-800 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-md border border-coral-200"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer with summary */}
        {!loading && deletedRecords.length > 0 && (
          <div className="bg-teal-50/80 border-t border-teal-100 p-4 flex justify-between items-center">
            <div className="text-sm text-teal-600">
              Showing <span className="font-semibold text-teal-800">{deletedRecords.length}</span> deleted items
              {activeTab === 'inventory' && inventoryStats() && (
                <span className="ml-2">
                  (<span className="font-semibold text-seafoam-700">{inventoryStats().bhwCount}</span> BHW • 
                  <span className="font-semibold text-lavender-700 ml-1">{inventoryStats().bnsCount}</span> BNS)
                </span>
              )}
            </div>
            <div className="text-xs text-teal-400">
              Items are automatically purged after 30 days
            </div>
          </div>
        )}
      </motion.div>

      {/* Inventory Summary Card */}
      {activeTab === 'inventory' && !loading && deletedRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-gradient-to-r from-seafoam-50 to-seafoam-100/50 border border-seafoam-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-seafoam-400"></div>
                <h3 className="font-semibold text-seafoam-800">BHW Inventory</h3>
              </div>
              <span className="text-2xl">🏥</span>
            </div>
            <div className="text-2xl font-bold text-seafoam-700 mb-2">
              {inventoryStats()?.bhwCount || 0} items
            </div>
            <div className="text-sm text-seafoam-600">
              Maternal care supplies and equipment
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-lavender-50 to-lavender-100/50 border border-lavender-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-lavender-400"></div>
                <h3 className="font-semibold text-lavender-800">BNS Inventory</h3>
              </div>
              <span className="text-2xl">🥗</span>
            </div>
            <div className="text-2xl font-bold text-lavender-700 mb-2">
              {inventoryStats()?.bnsCount || 0} items
            </div>
            <div className="text-sm text-lavender-600">
              Child nutrition supplies and supplements
            </div>
          </div>
        </motion.div>
      )}

      {/* Add custom colors to Tailwind if not already present */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        :global() {
          .bg-teal-50 { background-color: #f0fdfa; }
          .bg-teal-100 { background-color: #ccfbf1; }
          .bg-teal-200 { background-color: #99f6e4; }
          .bg-teal-300 { background-color: #5eead4; }
          .bg-teal-400 { background-color: #2dd4bf; }
          .bg-teal-500 { background-color: #14b8a6; }
          .bg-teal-600 { background-color: #0d9488; }
          .bg-teal-700 { background-color: #0f766e; }
          .bg-teal-800 { background-color: #115e59; }
          .bg-teal-900 { background-color: #134e4a; }
          
          .bg-seafoam-50 { background-color: #f0fdf9; }
          .bg-seafoam-100 { background-color: #ccfbef; }
          .bg-seafoam-200 { background-color: #99f6e0; }
          .bg-seafoam-400 { background-color: #5eead0; }
          .bg-seafoam-700 { background-color: #0d9482; }
          
          .bg-sky-50 { background-color: #f0f9ff; }
          .bg-sky-100 { background-color: #e0f2fe; }
          .bg-sky-200 { background-color: #bae6fd; }
          .bg-sky-400 { background-color: #38bdf8; }
          .bg-sky-700 { background-color: #0369a1; }
          
          .bg-lavender-50 { background-color: #f5f3ff; }
          .bg-lavender-100 { background-color: #ede9fe; }
          .bg-lavender-200 { background-color: #ddd6fe; }
          .bg-lavender-400 { background-color: #a78bfa; }
          .bg-lavender-700 { background-color: #7c3aed; }
          
          .bg-coral-50 { background-color: #fff7ed; }
          .bg-coral-100 { background-color: #ffedd5; }
          .bg-coral-200 { background-color: #fed7aa; }
          .bg-coral-400 { background-color: #fb923c; }
          .bg-coral-500 { background-color: #f97316; }
          .bg-coral-600 { background-color: #ea580c; }
          .bg-coral-800 { background-color: #9a3412; }
          
          .bg-emerald-50 { background-color: #ecfdf5; }
          .bg-emerald-100 { background-color: #d1fae5; }
          .bg-emerald-200 { background-color: #a7f3d0; }
          .bg-emerald-400 { background-color: #34d399; }
          .bg-emerald-800 { background-color: #065f46; }
          
          .bg-amber-400 { background-color: #fbbf24; }
          .bg-mint-50 { background-color: #f0fdf4; }
          
          body {
            font-family: 'Inter', sans-serif;
          }
        }
      `}</style>
    </div>
  );
}