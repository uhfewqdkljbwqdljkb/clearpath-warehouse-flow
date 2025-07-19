export interface Zone {
  id: string;
  code: string; // "A", "B", "C", "D"
  name: string; // "Electronics", "Apparel", etc.
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Row {
  id: string;
  zone_id: string;
  row_number: string; // "01", "02", "03"
  row_code: string; // "A01", "B03"
  max_bins: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zone?: Zone;
}

export interface Bin {
  id: string;
  row_id: string;
  bin_number: string; // "01", "05", "12"
  location_code: string; // "A01-05"
  barcode: string; // "LOC-A01-05"
  capacity_cubic_feet: number;
  is_occupied: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  row?: Row;
}

export interface WarehouseStats {
  total_zones: number;
  total_rows: number;
  total_bins: number;
  occupied_bins: number;
  available_bins: number;
  occupancy_rate: number;
  total_capacity: number;
  used_capacity: number;
}

export interface LocationSearchResult {
  zones: Zone[];
  rows: Row[];
  bins: Bin[];
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