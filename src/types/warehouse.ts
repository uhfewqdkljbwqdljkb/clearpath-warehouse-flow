export interface Zone {
  id: string;
  code: string; // "A", "B", "C", "D", "E", "F", "G", "Z"
  name: string;
  description: string;
  zone_type: 'floor' | 'shelf'; // floor zones A-G, shelf zone Z
  client_id?: string; // Only for floor zones - one client per zone
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Row {
  id: string;
  zone_id: string; // Only applies to Zone Z
  row_number: string; // "01", "02", "03" - sequential numbering
  location_code: string; // "ZONE-Z-ROW-01"
  barcode: string; // "LOC-ZONE-Z-ROW-01"
  capacity_cubic_feet: number;
  is_occupied: boolean;
  client_id?: string; // Which client is using this row
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zone?: Zone;
}

export interface WarehouseStats {
  total_zones: number;
  floor_zones_available: number;
  floor_zones_occupied: number;
  shelf_rows_total: number;
  shelf_rows_occupied: number;
  shelf_rows_available: number;
  total_capacity: number;
  used_capacity: number;
  occupancy_rate: number;
}

export interface LocationSearchResult {
  zones: Zone[];
  rows: Row[];
}

export type UserRole = 'warehouse_staff' | 'client';

export interface WarehouseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}