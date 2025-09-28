import { Zone, Row, WarehouseStats, LocationSearchResult } from '@/types/warehouse';

// In-memory storage (simulating database)
let zones: Zone[] = [];
let rows: Row[] = [];

// Barcode validation patterns
const FLOOR_ZONE_BARCODE_PATTERN = /^LOC-ZONE-[A-G]$/;
const SHELF_ROW_BARCODE_PATTERN = /^LOC-ZONE-Z-ROW-\d{2}$/;

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateTimestamp = () => new Date().toISOString();

// Barcode System
export const generateBarcode = (locationCode: string): string => {
  return `LOC-${locationCode}`;
};

export const validateBarcode = (barcode: string): boolean => {
  return FLOOR_ZONE_BARCODE_PATTERN.test(barcode) || SHELF_ROW_BARCODE_PATTERN.test(barcode);
};

export const lookupByBarcode = (barcode: string): Zone | Row | null => {
  // Check floor zones
  const zone = zones.find(zone => zone.zone_type === 'floor' && generateBarcode(zone.code) === barcode);
  if (zone) return zone;
  
  // Check shelf rows
  const row = rows.find(row => row.barcode === barcode);
  if (row) return row;
  
  return null;
};

// Zone Management
export const createZone = (zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at'>): Zone => {
  const zone: Zone = {
    ...zoneData,
    id: generateId(),
    created_at: generateTimestamp(),
    updated_at: generateTimestamp()
  };
  zones.push(zone);
  return zone;
};

export const getAllZones = (): Zone[] => {
  return zones.filter(zone => zone.is_active);
};

export const getFloorZones = (): Zone[] => {
  return zones.filter(zone => zone.is_active && zone.zone_type === 'floor');
};

export const getShelfZone = (): Zone | null => {
  return zones.find(zone => zone.is_active && zone.zone_type === 'shelf') || null;
};

export const getZoneById = (id: string): Zone | null => {
  return zones.find(zone => zone.id === id) || null;
};

export const getZoneByCode = (code: string): Zone | null => {
  return zones.find(zone => zone.code === code && zone.is_active) || null;
};

export const updateZone = (id: string, updates: Partial<Zone>): Zone | null => {
  const index = zones.findIndex(zone => zone.id === id);
  if (index === -1) return null;
  
  zones[index] = {
    ...zones[index],
    ...updates,
    updated_at: generateTimestamp()
  };
  return zones[index];
};

export const deleteZone = (id: string): boolean => {
  const zone = getZoneById(id);
  if (!zone) return false;
  
  // If it's the shelf zone, remove all rows
  if (zone.zone_type === 'shelf') {
    rows = rows.filter(row => row.zone_id !== id);
  }
  
  const index = zones.findIndex(z => z.id === id);
  if (index === -1) return false;
  
  zones.splice(index, 1);
  return true;
};

// Row Management (only for Zone Z)
export const createRow = (rowData: Omit<Row, 'id' | 'created_at' | 'updated_at'>): Row => {
  const shelfZone = getShelfZone();
  if (!shelfZone) throw new Error('Shelf zone (Z) not found');
  
  const row: Row = {
    ...rowData,
    id: generateId(),
    zone_id: shelfZone.id,
    created_at: generateTimestamp(),
    updated_at: generateTimestamp()
  };
  rows.push(row);
  return row;
};

export const getRowsByZone = (zoneId: string): Row[] => {
  return rows.filter(row => row.zone_id === zoneId && row.is_active);
};

export const getAllRows = (): Row[] => {
  return rows.filter(row => row.is_active);
};

export const getRowById = (id: string): Row | null => {
  return rows.find(row => row.id === id) || null;
};

export const updateRow = (id: string, updates: Partial<Row>): Row | null => {
  const index = rows.findIndex(row => row.id === id);
  if (index === -1) return null;
  
  rows[index] = {
    ...rows[index],
    ...updates,
    updated_at: generateTimestamp()
  };
  return rows[index];
};

export const deleteRow = (id: string): boolean => {
  const row = getRowById(id);
  if (!row) return false;
  
  // Check if row is occupied
  if (row.is_occupied) {
    throw new Error('Cannot delete occupied row');
  }
  
  const index = rows.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  rows.splice(index, 1);
  return true;
};

export const addRowToShelfZone = (): Row | null => {
  const shelfZone = getShelfZone();
  if (!shelfZone) return null;
  
  const existingRows = getRowsByZone(shelfZone.id);
  const nextRowNumber = (existingRows.length + 1).toString().padStart(2, '0');
  const locationCode = `ZONE-Z-ROW-${nextRowNumber}`;
  const barcode = generateBarcode(locationCode);
  
  return createRow({
    zone_id: shelfZone.id,
    row_number: nextRowNumber,
    location_code: locationCode,
    barcode: barcode,
    capacity_cubic_feet: 100, // Default capacity
    is_occupied: false,
    is_active: true
  });
};

// Client Assignment
export const assignClientToFloorZone = (zoneCode: string, clientId: string): Zone | null => {
  const zone = getZoneByCode(zoneCode);
  if (!zone || zone.zone_type !== 'floor') return null;
  
  // Check if zone is already assigned
  if (zone.client_id && zone.client_id !== clientId) {
    throw new Error(`Zone ${zoneCode} is already assigned to another client`);
  }
  
  return updateZone(zone.id, { client_id: clientId });
};

export const unassignClientFromFloorZone = (zoneCode: string): Zone | null => {
  const zone = getZoneByCode(zoneCode);
  if (!zone || zone.zone_type !== 'floor') return null;
  
  return updateZone(zone.id, { client_id: undefined });
};

export const assignClientToRow = (rowId: string, clientId: string): Row | null => {
  const row = getRowById(rowId);
  if (!row) return null;
  
  return updateRow(rowId, { 
    client_id: clientId,
    is_occupied: true
  });
};

export const unassignClientFromRow = (rowId: string): Row | null => {
  const row = getRowById(rowId);
  if (!row) return null;
  
  return updateRow(rowId, { 
    client_id: undefined,
    is_occupied: false
  });
};

// Search and Utility Functions
export const searchLocations = (query: string): LocationSearchResult => {
  const lowerQuery = query.toLowerCase();
  
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

export const getWarehouseStats = (): WarehouseStats => {
  const floorZones = getFloorZones();
  const allRows = getAllRows();
  
  const floor_zones_occupied = floorZones.filter(z => z.client_id).length;
  const floor_zones_available = floorZones.length - floor_zones_occupied;
  const shelf_rows_occupied = allRows.filter(r => r.is_occupied).length;
  const shelf_rows_available = allRows.length - shelf_rows_occupied;
  
  // Calculate capacity (floor zones estimated at 500 cubic feet each)
  const floor_capacity = floorZones.length * 500;
  const shelf_capacity = allRows.reduce((sum, row) => sum + row.capacity_cubic_feet, 0);
  const total_capacity = floor_capacity + shelf_capacity;
  
  const used_floor_capacity = floor_zones_occupied * 500; // Assume full utilization when occupied
  const used_shelf_capacity = allRows.filter(r => r.is_occupied).reduce((sum, row) => sum + row.capacity_cubic_feet, 0);
  const used_capacity = used_floor_capacity + used_shelf_capacity;
  
  const occupancy_rate = total_capacity > 0 ? (used_capacity / total_capacity) * 100 : 0;
  
  return {
    total_zones: zones.filter(z => z.is_active).length,
    floor_zones_available,
    floor_zones_occupied,
    shelf_rows_total: allRows.length,
    shelf_rows_occupied,
    shelf_rows_available,
    total_capacity,
    used_capacity,
    occupancy_rate
  };
};

// Sample Data Generation
export const generateSampleData = (): void => {
  // Clear existing data
  zones = [];
  rows = [];
  
  // Create 7 floor zones (A-G)
  const floorZoneCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  floorZoneCodes.forEach(code => {
    createZone({
      code: code,
      name: `Zone ${code}`,
      description: `Floor storage zone ${code} - dedicated client space`,
      zone_type: 'floor',
      is_active: true
    });
  });
  
  // Create 1 shelf zone (Z)
  createZone({
    code: 'Z',
    name: 'Zone Z - Shelf Storage',
    description: 'Multi-row shelf storage system',
    zone_type: 'shelf',
    is_active: true
  });
  
  // Add initial 5 rows to Zone Z
  for (let i = 1; i <= 5; i++) {
    addRowToShelfZone();
  }
  
  console.log(`Generated clean warehouse data: ${zones.length} zones, ${rows.length} rows`);
};

// Initialize with sample data
if (zones.length === 0) {
  generateSampleData();
}