import { Zone, Row, Bin, WarehouseStats, LocationSearchResult } from '@/types/warehouse';

// In-memory storage (simulating database)
let zones: Zone[] = [];
let rows: Row[] = [];
let bins: Bin[] = [];

// Barcode validation pattern
const BARCODE_PATTERN = /^LOC-[A-D]\d{2}-\d{2}$/;

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateTimestamp = () => new Date().toISOString();

// Barcode System
export const generateBarcode = (locationCode: string): string => {
  return `LOC-${locationCode}`;
};

export const validateBarcode = (barcode: string): boolean => {
  return BARCODE_PATTERN.test(barcode);
};

export const lookupByBarcode = (barcode: string): Bin | null => {
  return bins.find(bin => bin.barcode === barcode) || null;
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

export const getZoneById = (id: string): Zone | null => {
  return zones.find(zone => zone.id === id) || null;
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
  // Cascade delete: remove all rows and bins in this zone
  const zoneRows = rows.filter(row => row.zone_id === id);
  zoneRows.forEach(row => {
    bins = bins.filter(bin => bin.row_id !== row.id);
  });
  rows = rows.filter(row => row.zone_id !== id);
  
  const index = zones.findIndex(zone => zone.id === id);
  if (index === -1) return false;
  
  zones.splice(index, 1);
  return true;
};

// Row Management
export const createRow = (zoneId: string, rowData: Omit<Row, 'id' | 'zone_id' | 'created_at' | 'updated_at'>): Row => {
  const zone = getZoneById(zoneId);
  if (!zone) throw new Error('Zone not found');
  
  const row: Row = {
    ...rowData,
    id: generateId(),
    zone_id: zoneId,
    created_at: generateTimestamp(),
    updated_at: generateTimestamp()
  };
  rows.push(row);
  return row;
};

export const getRowsByZone = (zoneId: string): Row[] => {
  return rows.filter(row => row.zone_id === zoneId && row.is_active);
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
  // Cascade delete: remove all bins in this row
  bins = bins.filter(bin => bin.row_id !== id);
  
  const index = rows.findIndex(row => row.id === id);
  if (index === -1) return false;
  
  rows.splice(index, 1);
  return true;
};

// Bin Management
export const createBin = (rowId: string, binData: Omit<Bin, 'id' | 'row_id' | 'created_at' | 'updated_at'>): Bin => {
  const row = getRowById(rowId);
  if (!row) throw new Error('Row not found');
  
  const bin: Bin = {
    ...binData,
    id: generateId(),
    row_id: rowId,
    created_at: generateTimestamp(),
    updated_at: generateTimestamp()
  };
  bins.push(bin);
  return bin;
};

export const getBinsByRow = (rowId: string): Bin[] => {
  return bins.filter(bin => bin.row_id === rowId && bin.is_active);
};

export const getBinById = (id: string): Bin | null => {
  return bins.find(bin => bin.id === id) || null;
};

export const updateBin = (id: string, updates: Partial<Bin>): Bin | null => {
  const index = bins.findIndex(bin => bin.id === id);
  if (index === -1) return null;
  
  bins[index] = {
    ...bins[index],
    ...updates,
    updated_at: generateTimestamp()
  };
  return bins[index];
};

export const deleteBin = (id: string): boolean => {
  const index = bins.findIndex(bin => bin.id === id);
  if (index === -1) return false;
  
  bins.splice(index, 1);
  return true;
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
    row.row_code.toLowerCase().includes(lowerQuery) ||
    row.row_number.toLowerCase().includes(lowerQuery)
  );
  
  const matchedBins = bins.filter(bin => 
    bin.location_code.toLowerCase().includes(lowerQuery) ||
    bin.barcode.toLowerCase().includes(lowerQuery) ||
    bin.bin_number.toLowerCase().includes(lowerQuery)
  );
  
  return {
    zones: matchedZones,
    rows: matchedRows,
    bins: matchedBins
  };
};

export const getWarehouseStats = (): WarehouseStats => {
  const total_zones = zones.filter(z => z.is_active).length;
  const total_rows = rows.filter(r => r.is_active).length;
  const total_bins = bins.filter(b => b.is_active).length;
  const occupied_bins = bins.filter(b => b.is_active && b.is_occupied).length;
  const available_bins = total_bins - occupied_bins;
  const occupancy_rate = total_bins > 0 ? (occupied_bins / total_bins) * 100 : 0;
  const total_capacity = bins.reduce((sum, bin) => sum + bin.capacity_cubic_feet, 0);
  const used_capacity = bins.filter(b => b.is_occupied).reduce((sum, bin) => sum + bin.capacity_cubic_feet, 0);
  
  return {
    total_zones,
    total_rows,
    total_bins,
    occupied_bins,
    available_bins,
    occupancy_rate,
    total_capacity,
    used_capacity
  };
};

export const generateMissingBarcodes = (): number => {
  let count = 0;
  bins.forEach(bin => {
    if (!bin.barcode || !validateBarcode(bin.barcode)) {
      bin.barcode = generateBarcode(bin.location_code);
      bin.updated_at = generateTimestamp();
      count++;
    }
  });
  return count;
};

// Sample Data Generation
export const generateSampleData = (): void => {
  // Clear existing data
  zones = [];
  rows = [];
  bins = [];
  
  // Create sample zones
  const sampleZones = [
    { code: "A", name: "Electronics & Small Items", description: "High-value, small products", is_active: true },
    { code: "B", name: "Apparel & Textiles", description: "Clothing and fabric items", is_active: true },
    { code: "C", name: "Large Items", description: "Furniture and large products", is_active: true },
    { code: "D", name: "Seasonal & Overflow", description: "Temporary and seasonal storage", is_active: true }
  ];
  
  const createdZones = sampleZones.map(zoneData => createZone(zoneData));
  
  // Generate rows and bins for each zone
  const zoneConfigs = [
    { zoneCode: "A", rows: 15, binsPerRow: 20 }, // 300 bins
    { zoneCode: "B", rows: 10, binsPerRow: 15 }, // 150 bins
    { zoneCode: "C", rows: 8, binsPerRow: 12 },  // 96 bins
    { zoneCode: "D", rows: 5, binsPerRow: 10 }   // 50 bins
  ];
  
  createdZones.forEach((zone, zoneIndex) => {
    const config = zoneConfigs[zoneIndex];
    
    // Create rows for this zone
    for (let rowNum = 1; rowNum <= config.rows; rowNum++) {
      const rowNumber = rowNum.toString().padStart(2, '0');
      const rowCode = `${zone.code}${rowNumber}`;
      
      const row = createRow(zone.id, {
        row_number: rowNumber,
        row_code: rowCode,
        max_bins: config.binsPerRow,
        is_active: true
      });
      
      // Create bins for this row
      for (let binNum = 1; binNum <= config.binsPerRow; binNum++) {
        const binNumber = binNum.toString().padStart(2, '0');
        const locationCode = `${rowCode}-${binNumber}`;
        const barcode = generateBarcode(locationCode);
        
        // Randomly occupy some bins (30% occupancy)
        const isOccupied = Math.random() < 0.3;
        
        // Vary capacity based on zone
        let capacity;
        switch (zone.code) {
          case 'A': capacity = 10 + Math.random() * 20; break; // 10-30 cubic feet
          case 'B': capacity = 15 + Math.random() * 25; break; // 15-40 cubic feet
          case 'C': capacity = 50 + Math.random() * 100; break; // 50-150 cubic feet
          case 'D': capacity = 20 + Math.random() * 30; break; // 20-50 cubic feet
          default: capacity = 25;
        }
        
        createBin(row.id, {
          bin_number: binNumber,
          location_code: locationCode,
          barcode: barcode,
          capacity_cubic_feet: Math.round(capacity * 10) / 10, // Round to 1 decimal
          is_occupied: isOccupied,
          is_active: true
        });
      }
    }
  });
  
  console.log(`Generated sample data: ${zones.length} zones, ${rows.length} rows, ${bins.length} bins`);
};

// Initialize with sample data
if (zones.length === 0) {
  generateSampleData();
}