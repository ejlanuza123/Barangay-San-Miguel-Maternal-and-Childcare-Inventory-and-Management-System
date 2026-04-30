import { supabase } from './supabase';

const DEFAULT_MIN_STOCK_LEVEL = 10;
const CRITICAL_COVERAGE_DAYS = 7;
const REORDER_COVERAGE_DAYS = 14;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getUsageAwareThreshold = (min_stock_level, averageDailyUsage = 0, coverageDays = REORDER_COVERAGE_DAYS) => {
  const baseThreshold = toNumber(min_stock_level, DEFAULT_MIN_STOCK_LEVEL);
  const usageThreshold = Math.ceil(toNumber(averageDailyUsage, 0) * coverageDays);
  return Math.max(baseThreshold, usageThreshold || 0);
};

export const getInventoryStockStatus = (quantity, min_stock_level, averageDailyUsage = 0) => {
  const stockQuantity = toNumber(quantity, 0);
  const criticalThreshold = getUsageAwareThreshold(min_stock_level, averageDailyUsage, CRITICAL_COVERAGE_DAYS);
  const lowThreshold = getUsageAwareThreshold(min_stock_level, averageDailyUsage, REORDER_COVERAGE_DAYS);

  if (stockQuantity <= criticalThreshold) {
    return { status: 'Critical', criticalThreshold, lowThreshold, needsReorder: true };
  }

  if (stockQuantity <= lowThreshold) {
    return { status: 'Low', criticalThreshold, lowThreshold, needsReorder: true };
  }

  return { status: 'Normal', criticalThreshold, lowThreshold, needsReorder: false };
};

/**
 * Get expiry status for an item
 * @param {string} expiry_date - The expiry date
 * @returns {object} - { status: string, daysRemaining: number, message: string }
 */
export const getExpiryStatus = (expiry_date) => {
  if (!expiry_date) {
    return {
      status: 'no-date',
      daysRemaining: null,
      message: 'No expiry date',
      color: 'gray'
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expiry_date);
  expiryDate.setHours(0, 0, 0, 0);
  
  const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return {
      status: 'expired',
      daysRemaining: daysUntilExpiry,
      message: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
      color: 'red'
    };
  }
  
  if (daysUntilExpiry === 0) {
    return {
      status: 'expires-today',
      daysRemaining: 0,
      message: 'Expires today',
      color: 'red'
    };
  }
  
  if (daysUntilExpiry <= 7) {
    return {
      status: 'expiring-soon',
      daysRemaining: daysUntilExpiry,
      message: `Expires in ${daysUntilExpiry} day(s)`,
      color: 'red'
    };
  }
  
  if (daysUntilExpiry <= 30) {
    return {
      status: 'expiring',
      daysRemaining: daysUntilExpiry,
      message: `Expires in ${daysUntilExpiry} days`,
      color: 'yellow'
    };
  }
  
  return {
    status: 'ok',
    daysRemaining: daysUntilExpiry,
    message: `Valid for ${daysUntilExpiry} days`,
    color: 'green'
  };
};

/**
 * Check if an item needs reordering
 * @param {number} quantity - Current quantity
 * @param {number} min_stock_level - Minimum stock level
 * @param {number} averageDailyUsage - Average daily usage for the item
 * @returns {boolean}
 */
export const needsReordering = (quantity, min_stock_level, averageDailyUsage = 0) => {
  return toNumber(quantity, 0) <= getUsageAwareThreshold(min_stock_level, averageDailyUsage, REORDER_COVERAGE_DAYS);
};

/**
 * Log inventory movement (stock change)
 * @param {string} inventory_id - Inventory item ID
 * @param {string} movement_type - IN, OUT, ADJUSTMENT, WASTE
 * @param {number} quantity_change - Amount changed
 * @param {number} quantity_before - Stock before change
 * @param {number} quantity_after - Stock after change
 * @param {string} reason - Reason for change
 * @param {string} reference_type - Optional: 'prescription', 'dispensing', 'adjustment'
 * @param {string} reference_id - Optional: Related record ID
 * @param {string} user_id - User making the change
 * @returns {Promise<object>}
 */
export const recordInventoryMovement = async (
  inventory_id,
  movement_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reason = '',
  reference_type = null,
  reference_id = null,
  user_id = null,
  notes = ''
) => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([{
        inventory_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reason,
        reference_type,
        reference_id,
        created_by: user_id,
        notes
      }])
      .select();

    if (error) {
      console.error('Error recording inventory movement:', error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error('Error in recordInventoryMovement:', err);
    return { error: err };
  }
};

/**
 * Get inventory movements for an item
 * @param {string} inventory_id - Inventory item ID
 * @param {number} limit - Number of records to retrieve
 * @returns {Promise<array>}
 */
export const getInventoryMovements = async (inventory_id, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, profiles(full_name, role)')
      .eq('inventory_id', inventory_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching inventory movements:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getInventoryMovements:', err);
    return [];
  }
};

/**
 * Get inventory summary (items expiring soon, low stock, etc.)
 * @returns {Promise<object>}
 */
export const getInventorySummary = async () => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) throw error;

    const summary = {
      totalItems: inventory.length,
      expiredItems: [],
      expiringItems: [],
      isSoonExpiring: [],
      lowStockItems: [],
      criticalStockItems: [],
      totalValue: 0
    };

    inventory.forEach(item => {
      const expiryStatus = getExpiryStatus(item.expiry_date);
      
      if (expiryStatus.status === 'expired') {
        summary.expiredItems.push(item);
      } else if (expiryStatus.status === 'expiring-soon' || expiryStatus.status === 'expires-today') {
        summary.expiringItems.push(item);
      } else if (expiryStatus.status === 'expiring') {
        summary.isSoonExpiring.push(item);
      }

      const stockStatus = getInventoryStockStatus(item.quantity, item.min_stock_level);

      if (stockStatus.needsReorder) {
        if (stockStatus.status === 'Critical') {
          summary.criticalStockItems.push(item);
        } else {
          summary.lowStockItems.push(item);
        }
      }
    });

    return summary;
  } catch (err) {
    console.error('Error in getInventorySummary:', err);
    return {
      totalItems: 0,
      expiredItems: [],
      expiringItems: [],
      isSoonExpiring: [],
      lowStockItems: [],
      criticalStockItems: [],
      totalValue: 0
    };
  }
};

/**
 * Get usage analytics - which items are dispensed most frequently
 * @param {number} daysBack - Number of days to look back (default: 90)
 * @returns {Promise<array>} - Array of items with usage counts, sorted by most used
 */
export const getUsageAnalytics = async (daysBack = 90) => {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    // Get all OUT/WASTE movements in the time period
    const { data: movements, error: movementsError } = await supabase
      .from('inventory_movements')
      .select('inventory_id, movement_type, quantity_change, created_at')
      .in('movement_type', ['OUT', 'WASTE'])
      .gte('created_at', dateThreshold.toISOString());

    if (movementsError) throw movementsError;

    // Get all inventory items to join with
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, item_name, category, unit, quantity');

    if (inventoryError) throw inventoryError;

    // Aggregate movements by item
    const usageMap = {};
    movements.forEach(movement => {
      if (!usageMap[movement.inventory_id]) {
        usageMap[movement.inventory_id] = {
          totalDispensed: 0,
          dispensedCount: 0,
          wasteCount: 0
        };
      }
      usageMap[movement.inventory_id].totalDispensed += Math.abs(movement.quantity_change);
      if (movement.movement_type === 'OUT') {
        usageMap[movement.inventory_id].dispensedCount++;
      } else {
        usageMap[movement.inventory_id].wasteCount++;
      }
    });

    // Map to inventory items and sort by usage
    const analytics = inventory
      .map(item => ({
        id: item.id,
        itemName: item.item_name,
        category: item.category,
        unit: item.unit,
        currentStock: item.quantity,
        totalDispensed: usageMap[item.id]?.totalDispensed || 0,
        timesDispensed: usageMap[item.id]?.dispensedCount || 0,
        wastageCount: usageMap[item.id]?.wasteCount || 0,
        averageUsePerDispense: usageMap[item.id] ? 
          (usageMap[item.id].totalDispensed / usageMap[item.id].dispensedCount || 0).toFixed(2) : 0
      }))
      .filter(item => item.totalDispensed > 0) // Only items that were used
      .sort((a, b) => b.totalDispensed - a.totalDispensed);

    return analytics;
  } catch (err) {
    console.error('Error in getUsageAnalytics:', err);
    return [];
  }
};

/**
 * Get expiry risk dashboard - categorize items by expiry windows
 * @returns {Promise<object>} - Items grouped by expiry risk level
 */
export const getExpiryRiskDashboard = async () => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) throw error;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dashboard = {
      expired: [],
      expiringSoon: [],    // 0-7 days
      expiringShortTerm: [], // 8-30 days
      expiringMediumTerm: [], // 31-90 days
      expiringLongTerm: [],  // 91+ days
      noExpiryDate: []
    };

    inventory.forEach(item => {
      if (!item.expiry_date) {
        dashboard.noExpiryDate.push(item);
        return;
      }

      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        dashboard.expired.push({
          ...item,
          daysOverdue: Math.abs(daysUntilExpiry)
        });
      } else if (daysUntilExpiry <= 7) {
        dashboard.expiringSoon.push({
          ...item,
          daysRemaining: daysUntilExpiry
        });
      } else if (daysUntilExpiry <= 30) {
        dashboard.expiringShortTerm.push({
          ...item,
          daysRemaining: daysUntilExpiry
        });
      } else if (daysUntilExpiry <= 90) {
        dashboard.expiringMediumTerm.push({
          ...item,
          daysRemaining: daysUntilExpiry
        });
      } else {
        dashboard.expiringLongTerm.push({
          ...item,
          daysRemaining: daysUntilExpiry
        });
      }
    });

    // Sort each category by days remaining (ascending)
    dashboard.expired.sort((a, b) => a.daysOverdue - b.daysOverdue);
    dashboard.expiringSoon.sort((a, b) => a.daysRemaining - b.daysRemaining);
    dashboard.expiringShortTerm.sort((a, b) => a.daysRemaining - b.daysRemaining);
    dashboard.expiringMediumTerm.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return dashboard;
  } catch (err) {
    console.error('Error in getExpiryRiskDashboard:', err);
    return {
      expired: [],
      expiringSoon: [],
      expiringShortTerm: [],
      expiringMediumTerm: [],
      expiringLongTerm: [],
      noExpiryDate: []
    };
  }
};


export const getItemBatches = async (itemName, excludeItemId = null) => {
  try {
    let query = supabase
      .from('inventory')
      .select('*')
      .ilike('item_name', `%${itemName}%`)
      .order('expiry_date', { ascending: true })
      .order('batch_no', { ascending: true });

    if (excludeItemId) {
      query = query.neq('id', excludeItemId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching item batches:', err);
    return [];
  }
};

/**
 * Refill a specific batch of an item
 * @param {string} itemId - The specific inventory item ID to refill
 * @param {number} quantityToAdd - Quantity to add
 * @param {string} remarks - Optional remarks
 * @param {string} userId - User performing the refill
 * @returns {Promise<object>}
 */
export const refillInventoryItem = async (itemId, quantityToAdd, remarks = '', userId = null) => {
  try {
    // Get current item state
    const { data: currentItem, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = (currentItem.quantity || 0) + quantityToAdd;
    
    const usageAnalytics = await getUsageAnalytics(90);
    const averageDailyUsage = usageAnalytics.find((item) => item.id === itemId)?.averageUsePerDispense || 0;
    const newStatus = getInventoryStockStatus(newQuantity, currentItem.min_stock_level, averageDailyUsage).status;

    // Update the inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQuantity, 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', itemId);

    if (updateError) throw updateError;

    // Record the movement
    await recordInventoryMovement(
      itemId,
      'IN',
      quantityToAdd,
      currentItem.quantity,
      newQuantity,
      remarks || 'Stock refill',
      'refill',
      null,
      userId,
      remarks
    );

    return { 
      success: true, 
      item: { 
        ...currentItem, 
        quantity: newQuantity, 
        status: newStatus 
      } 
    };
  } catch (err) {
    console.error('Error in refillInventoryItem:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get all items grouped by name with their batches
 * @returns {Promise<array>} - Array of item groups with their batches
 */
export const getInventoryGroupedByName = async () => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name', { ascending: true })
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    // Group by item name
    const grouped = {};
    inventory.forEach(item => {
      if (!grouped[item.item_name]) {
        grouped[item.item_name] = {
          itemName: item.item_name,
          totalQuantity: 0,
          batches: []
        };
      }
      grouped[item.item_name].totalQuantity += item.quantity || 0;
      grouped[item.item_name].batches.push(item);
    });

    return Object.values(grouped);
  } catch (err) {
    console.error('Error in getInventoryGroupedByName:', err);
    return [];
  }
};