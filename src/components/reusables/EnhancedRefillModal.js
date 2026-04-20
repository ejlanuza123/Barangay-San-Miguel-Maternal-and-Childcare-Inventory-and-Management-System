// src/components/reusables/EnhancedRefillModal.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';
import { refillInventoryItem, getItemBatches } from '../../services/inventoryService';
import { useAuth } from '../../context/AuthContext';

export default function EnhancedRefillModal({ initialItem, onClose, onSave, submitAsRequest = false, requesterId = null }) {
  const [selectedBatch, setSelectedBatch] = useState(initialItem);
  const [batches, setBatches] = useState([]);
  const [addQty, setAddQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Fetch all batches of this item
  useEffect(() => {
    const fetchBatches = async () => {
      const data = await getItemBatches(initialItem.item_name);
      setBatches(data);
      
      // If current item is in batches, keep it selected, otherwise select first
      if (data.length > 0) {
        const currentInList = data.find(b => b.id === initialItem.id);
        setSelectedBatch(currentInList || data[0]);
      }
    };
    
    fetchBatches();
  }, [initialItem]);

  const handleRefill = async (e) => {
    e.preventDefault();
    
    const qtyToAdd = parseInt(addQty);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      addNotification('Please enter a valid quantity.', 'error');
      return;
    }

    setLoading(true);

    if (submitAsRequest) {
      if (!requesterId) {
        addNotification('Unable to submit request: missing requester account.', 'error');
        setLoading(false);
        return;
      }

      const quantityToAdd = parseInt(addQty, 10);
      const nextQuantity = (selectedBatch.quantity || 0) + quantityToAdd;
      const requestPayload = {
        worker_id: requesterId,
        request_type: 'Update',
        target_table: 'inventory',
        target_record_id: selectedBatch.id,
        request_data: {
          quantity: nextQuantity,
          updated_at: new Date().toISOString(),
        },
        status: 'Pending',
      };

      const { error: requestError } = await supabase
        .from('requestions')
        .insert([requestPayload]);

      if (requestError) {
        addNotification(`Error: ${requestError.message}`, 'error');
        setLoading(false);
        return;
      }

      await logActivity(
        'Inventory Refill Request',
        `Submitted refill request for ${selectedBatch.item_name} (+${quantityToAdd}).`
      );
      addNotification('Refill request submitted for approval.', 'success');
      onSave();
      onClose();
      setLoading(false);
      return;
    }

    const result = await refillInventoryItem(
      selectedBatch.id,
      qtyToAdd,
      remarks,
      user?.id
    );

    if (result.success) {
      await logActivity(
        'Stock Refill',
        `Added ${qtyToAdd} units to ${selectedBatch.item_name} (Batch: ${selectedBatch.batch_no || 'N/A'})`
      );
      addNotification(
        `Successfully added ${qtyToAdd} units to ${selectedBatch.item_name}`,
        'success'
      );
      onSave();
      onClose();
    } else {
      addNotification(`Error: ${result.error}`, 'error');
    }

    setLoading(false);
  };

  const getStatusColor = (quantity) => {
    if (quantity <= 5) return 'bg-red-100 border-red-300';
    if (quantity <= 20) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Refill Stock</h2>
        
        {/* Batch Selection */}
        {batches.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Select Batch/Lot to Refill:
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {batches.map(batch => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatch(batch)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedBatch.id === batch.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          Batch: {batch.batch_no || 'N/A'}
                        </span>
                        {batch.expiry_date && (
                          <span className="text-xs text-gray-500">
                            Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-md text-xs ${getStatusColor(batch.quantity)}`}>
                        Current Stock: {batch.quantity} {batch.unit || 'pcs'}
                      </div>
                    </div>
                    {selectedBatch.id === batch.id && (
                      <span className="text-blue-600 text-sm font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Batch Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Selected:</span>{' '}
            {selectedBatch.item_name}
          </p>
          {selectedBatch.batch_no && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Batch/Lot:</span> {selectedBatch.batch_no}
            </p>
          )}
          {selectedBatch.expiry_date && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Expiry:</span>{' '}
              {new Date(selectedBatch.expiry_date).toLocaleDateString()}
            </p>
          )}
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Current Stock:</span>{' '}
            {selectedBatch.quantity} {selectedBatch.unit || 'pcs'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Source:</span> {selectedBatch.supply_source || 'N/A'}
          </p>
        </div>

        <form onSubmit={handleRefill} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Quantity to Add *
            </label>
            <input 
              type="number" 
              min="1" 
              value={addQty} 
              onChange={e => setAddQty(e.target.value)} 
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              required 
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Remarks / Source
            </label>
            <input 
              type="text" 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="e.g. New delivery from supplier, Donation, etc." 
            />
          </div>

          {/* Reorder Recommendation */}
          {selectedBatch.min_stock_level && (
            <div className={`p-3 rounded-lg ${
              selectedBatch.quantity < selectedBatch.min_stock_level 
                ? 'bg-orange-50 border border-orange-200' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Reorder Recommendation:
              </p>
              <p className="text-sm">
                {selectedBatch.quantity < selectedBatch.min_stock_level ? (
                  <span className="text-orange-700">
                    ⚠️ Current stock is below minimum level ({selectedBatch.min_stock_level} {selectedBatch.unit})
                  </span>
                ) : (
                  <span className="text-blue-700">
                    ✓ Stock is above minimum level ({selectedBatch.min_stock_level} {selectedBatch.unit})
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm Refill'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}