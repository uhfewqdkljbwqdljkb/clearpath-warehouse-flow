import { supabase } from '@/integrations/supabase/client';
import { Zone, Row, WarehouseStats, LocationSearchResult } from '@/types/warehouse';

// Barcode validation patterns
const FLOOR_ZONE_BARCODE_PATTERN = /^LOC-ZONE-[A-Z]$/;
const SHELF_ROW_BARCODE_PATTERN = /^LOC-ZONE-Z-ROW-\d{2}$/;

// Barcode System
export const generateBarcode = (locationCode: string): string => {
  return `LOC-${locationCode}`;
};

export const validateBarcode = (barcode: string): boolean => {
  return FLOOR_ZONE_BARCODE_PATTERN.test(barcode) || SHELF_ROW_BARCODE_PATTERN.test(barcode);
};

// Zone Management
export const getAllZones = async (): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('warehouse_zones')
    .select('*')
    .eq('is_active', true)
    .order('code');
  
  if (error) throw error;
  
  return (data || []).map(zone => ({
    id: zone.id,
    code: zone.code || '',
    name: zone.name,
    description: zone.name, // Using name as description since column doesn't exist
    zone_type: zone.zone_type as 'floor' | 'shelf',
    is_active: zone.is_active ?? true,
    created_at: zone.created_at || new Date().toISOString(),
    updated_at: zone.created_at || new Date().toISOString(), // Using created_at as fallback
  }));
};

export const getFloorZones = async (): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('warehouse_zones')
    .select('*')
    .eq('zone_type', 'floor')
    .eq('is_active', true)
    .order('code');
  
  if (error) throw error;
  
  return (data || []).map(zone => ({
    id: zone.id,
    code: zone.code || '',
    name: zone.name,
    description: zone.name,
    zone_type: 'floor' as const,
    is_active: zone.is_active ?? true,
    created_at: zone.created_at || new Date().toISOString(),
    updated_at: zone.created_at || new Date().toISOString(),
  }));
};

export const getShelfZone = async (): Promise<Zone | null> => {
  const { data, error } = await supabase
    .from('warehouse_zones')
    .select('*')
    .eq('zone_type', 'shelf')
    .eq('is_active', true)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    code: data.code || 'Z',
    name: data.name,
    description: data.name,
    zone_type: 'shelf' as const,
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const getZoneById = async (id: string): Promise<Zone | null> => {
  const { data, error } = await supabase
    .from('warehouse_zones')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    code: data.code || '',
    name: data.name,
    description: data.name,
    zone_type: data.zone_type as 'floor' | 'shelf',
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const getZoneByCode = async (code: string): Promise<Zone | null> => {
  const { data, error } = await supabase
    .from('warehouse_zones')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    code: data.code || '',
    name: data.name,
    description: data.name,
    zone_type: data.zone_type as 'floor' | 'shelf',
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const createZone = async (zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at'>): Promise<Zone> => {
  const { data, error } = await supabase
    .from('warehouse_zones')
    .insert({
      code: zoneData.code,
      name: zoneData.name,
      zone_type: zoneData.zone_type,
      is_active: zoneData.is_active,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    code: data.code || '',
    name: data.name,
    description: data.name,
    zone_type: data.zone_type as 'floor' | 'shelf',
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const updateZone = async (id: string, updates: Partial<Zone>): Promise<Zone | null> => {
  const updateData: Record<string, unknown> = {};
  if (updates.code !== undefined) updateData.code = updates.code;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  const { data, error } = await supabase
    .from('warehouse_zones')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    code: data.code || '',
    name: data.name,
    description: data.name,
    zone_type: data.zone_type as 'floor' | 'shelf',
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const deleteZone = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('warehouse_zones')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Row Management
export const getAllRows = async (): Promise<Row[]> => {
  const { data, error } = await supabase
    .from('warehouse_rows')
    .select(`
      *,
      warehouse_zones (
        id,
        name,
        code,
        color
      )
    `)
    .eq('is_active', true)
    .order('row_number');
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    zone_id: row.zone_id || '',
    row_number: row.row_number,
    location_code: row.code || `ZONE-Z-ROW-${row.row_number}`,
    barcode: `LOC-ZONE-Z-ROW-${row.row_number}`,
    capacity_cubic_feet: 100, // Default capacity
    is_occupied: row.is_occupied ?? false,
    client_id: row.assigned_company_id || undefined,
    is_active: row.is_active ?? true,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.created_at || new Date().toISOString(),
    zone: row.warehouse_zones ? {
      id: row.warehouse_zones.id,
      code: row.warehouse_zones.code || 'Z',
      name: row.warehouse_zones.name,
      description: row.warehouse_zones.name,
      zone_type: 'shelf' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } : undefined,
  }));
};

export const getRowsByZone = async (zoneId: string): Promise<Row[]> => {
  const { data, error } = await supabase
    .from('warehouse_rows')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('row_number');
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    zone_id: row.zone_id || '',
    row_number: row.row_number,
    location_code: row.code || `ZONE-Z-ROW-${row.row_number}`,
    barcode: `LOC-ZONE-Z-ROW-${row.row_number}`,
    capacity_cubic_feet: 100,
    is_occupied: row.is_occupied ?? false,
    client_id: row.assigned_company_id || undefined,
    is_active: row.is_active ?? true,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.created_at || new Date().toISOString(),
  }));
};

export const getRowById = async (id: string): Promise<Row | null> => {
  const { data, error } = await supabase
    .from('warehouse_rows')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    zone_id: data.zone_id || '',
    row_number: data.row_number,
    location_code: data.code || `ZONE-Z-ROW-${data.row_number}`,
    barcode: `LOC-ZONE-Z-ROW-${data.row_number}`,
    capacity_cubic_feet: 100,
    is_occupied: data.is_occupied ?? false,
    client_id: data.assigned_company_id || undefined,
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const createRow = async (rowData: Omit<Row, 'id' | 'created_at' | 'updated_at'>): Promise<Row> => {
  const { data, error } = await supabase
    .from('warehouse_rows')
    .insert({
      zone_id: rowData.zone_id,
      row_number: rowData.row_number,
      code: rowData.location_code,
      is_occupied: rowData.is_occupied,
      is_active: rowData.is_active,
      assigned_company_id: rowData.client_id || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    zone_id: data.zone_id || '',
    row_number: data.row_number,
    location_code: data.code || `ZONE-Z-ROW-${data.row_number}`,
    barcode: `LOC-ZONE-Z-ROW-${data.row_number}`,
    capacity_cubic_feet: 100,
    is_occupied: data.is_occupied ?? false,
    client_id: data.assigned_company_id || undefined,
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const updateRow = async (id: string, updates: Partial<Row>): Promise<Row | null> => {
  const updateData: Record<string, unknown> = {};
  if (updates.row_number !== undefined) updateData.row_number = updates.row_number;
  if (updates.location_code !== undefined) updateData.code = updates.location_code;
  if (updates.is_occupied !== undefined) updateData.is_occupied = updates.is_occupied;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.client_id !== undefined) updateData.assigned_company_id = updates.client_id || null;

  const { data, error } = await supabase
    .from('warehouse_rows')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    zone_id: data.zone_id || '',
    row_number: data.row_number,
    location_code: data.code || `ZONE-Z-ROW-${data.row_number}`,
    barcode: `LOC-ZONE-Z-ROW-${data.row_number}`,
    capacity_cubic_feet: 100,
    is_occupied: data.is_occupied ?? false,
    client_id: data.assigned_company_id || undefined,
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.created_at || new Date().toISOString(),
  };
};

export const deleteRow = async (id: string): Promise<boolean> => {
  // Check if row is occupied first
  const { data: row } = await supabase
    .from('warehouse_rows')
    .select('is_occupied, assigned_company_id')
    .eq('id', id)
    .maybeSingle();
  
  if (row?.is_occupied || row?.assigned_company_id) {
    throw new Error('Cannot delete an occupied row. Unassign the client first.');
  }
  
  const { error } = await supabase
    .from('warehouse_rows')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const getNextRowNumber = async (): Promise<string> => {
  const { data } = await supabase
    .from('warehouse_rows')
    .select('row_number')
    .order('row_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const nextNum = data ? parseInt(data.row_number) + 1 : 1;
  return nextNum.toString().padStart(2, '0');
};

export const addRowToShelfZone = async (): Promise<Row | null> => {
  const shelfZone = await getShelfZone();
  if (!shelfZone) return null;
  
  const nextRowNumber = await getNextRowNumber();
  const locationCode = `ZONE-Z-ROW-${nextRowNumber}`;
  const barcode = generateBarcode(locationCode);
  
  return createRow({
    zone_id: shelfZone.id,
    row_number: nextRowNumber,
    location_code: locationCode,
    barcode: barcode,
    capacity_cubic_feet: 100,
    is_occupied: false,
    is_active: true
  });
};

// Client Assignment
export const assignClientToFloorZone = async (zoneCode: string, clientId: string): Promise<Zone | null> => {
  const zone = await getZoneByCode(zoneCode);
  if (!zone || zone.zone_type !== 'floor') return null;
  
  // Update the company's assigned_floor_zone_id
  const { error } = await supabase
    .from('companies')
    .update({ assigned_floor_zone_id: zone.id })
    .eq('id', clientId);
  
  if (error) throw error;
  
  return zone;
};

export const unassignClientFromFloorZone = async (zoneCode: string): Promise<Zone | null> => {
  const zone = await getZoneByCode(zoneCode);
  if (!zone || zone.zone_type !== 'floor') return null;
  
  // Clear the company's assigned_floor_zone_id
  const { error } = await supabase
    .from('companies')
    .update({ assigned_floor_zone_id: null })
    .eq('assigned_floor_zone_id', zone.id);
  
  if (error) throw error;
  
  return zone;
};

export const assignClientToRow = async (rowId: string, clientId: string): Promise<Row | null> => {
  return updateRow(rowId, { 
    client_id: clientId,
    is_occupied: true
  });
};

export const unassignClientFromRow = async (rowId: string): Promise<Row | null> => {
  return updateRow(rowId, { 
    client_id: undefined,
    is_occupied: false
  });
};

// Search and Utility Functions
export const searchLocations = async (query: string): Promise<LocationSearchResult> => {
  const lowerQuery = query.toLowerCase();
  
  const [zones, rows] = await Promise.all([getAllZones(), getAllRows()]);
  
  const matchedZones = zones.filter(zone => 
    zone.code.toLowerCase().includes(lowerQuery) ||
    zone.name.toLowerCase().includes(lowerQuery) ||
    zone.description.toLowerCase().includes(lowerQuery)
  );
  
  const matchedRows = rows.filter(row => 
    row.location_code.toLowerCase().includes(lowerQuery) ||
    row.row_number.toLowerCase().includes(lowerQuery) ||
    row.barcode.toLowerCase().includes(lowerQuery)
  );
  
  return {
    zones: matchedZones,
    rows: matchedRows
  };
};

export const lookupByBarcode = async (barcode: string): Promise<Zone | Row | null> => {
  const [zones, rows] = await Promise.all([getAllZones(), getAllRows()]);
  
  // Check floor zones
  const zone = zones.find(zone => zone.zone_type === 'floor' && generateBarcode(zone.code) === barcode);
  if (zone) return zone;
  
  // Check shelf rows
  const row = rows.find(row => row.barcode === barcode);
  if (row) return row;
  
  return null;
};

export const getWarehouseStats = async (): Promise<WarehouseStats> => {
  const [zones, rows] = await Promise.all([getAllZones(), getAllRows()]);
  
  // Get companies to check floor zone assignments
  const { data: companies } = await supabase
    .from('companies')
    .select('assigned_floor_zone_id')
    .not('assigned_floor_zone_id', 'is', null);
  
  const assignedZoneIds = new Set((companies || []).map(c => c.assigned_floor_zone_id));
  
  const floorZones = zones.filter(z => z.zone_type === 'floor');
  const floor_zones_occupied = floorZones.filter(z => assignedZoneIds.has(z.id)).length;
  const floor_zones_available = floorZones.length - floor_zones_occupied;
  const shelf_rows_occupied = rows.filter(r => r.is_occupied || r.client_id).length;
  const shelf_rows_available = rows.length - shelf_rows_occupied;
  
  // Calculate capacity (floor zones estimated at 500 cubic feet each)
  const floor_capacity = floorZones.length * 500;
  const shelf_capacity = rows.reduce((sum, row) => sum + (row.capacity_cubic_feet || 100), 0);
  const total_capacity = floor_capacity + shelf_capacity;
  
  const used_floor_capacity = floor_zones_occupied * 500;
  const used_shelf_capacity = rows.filter(r => r.is_occupied).reduce((sum, row) => sum + (row.capacity_cubic_feet || 100), 0);
  const used_capacity = used_floor_capacity + used_shelf_capacity;
  
  const occupancy_rate = total_capacity > 0 ? (used_capacity / total_capacity) * 100 : 0;
  
  return {
    total_zones: zones.length,
    floor_zones_available,
    floor_zones_occupied,
    shelf_rows_total: rows.length,
    shelf_rows_occupied,
    shelf_rows_available,
    total_capacity,
    used_capacity,
    occupancy_rate
  };
};

// DEPRECATED: Sample data generation is no longer needed
// Data is now managed through Supabase database
export const generateSampleData = (): void => {
  console.warn('generateSampleData is deprecated. Use Supabase database for data management.');
};
