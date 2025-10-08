export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  reorderLevel: number;
  createdAt: string;
}

export interface InventoryItem {
  id: number;
  productId: number;
  quantity: number;
  locationRow: string;
  locationBin: string;
  lastUpdated: string;
  product?: Product;
}

export interface Location {
  id: number;
  rowNumber: string;
  binNumber: string;
  zone: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  clientId: number;
  orderNumber: string;
  status: 'pending' | 'picking' | 'packed' | 'shipped' | 'delivered';
  createdDate: string;
  shippedDate?: string;
  totalItems: number;
  clientName: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  pickedQuantity: number;
  location: string;
  product?: Product;
}

export type OrderStatus = 'pending' | 'picking' | 'packed' | 'shipped' | 'delivered';

// Client Management Types
export interface Client {
  id: string;
  client_code: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  billing_address: string;
  contract_start_date: string;
  contract_end_date: string;
  storage_plan: 'basic' | 'premium' | 'enterprise';
  max_storage_cubic_feet: number;
  monthly_fee: number;
  is_active: boolean;
  location_type?: 'floor_zone' | 'shelf_row';
  assigned_floor_zone_id?: string;
  assigned_row_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  client_id: string;
  username: string;
  email: string;
  role: 'client_admin' | 'client_viewer';
  is_active: boolean;
  last_login?: string;
}

// Analytics and Reporting Types
export interface CapacityMetrics {
  zoneId: string;
  zoneName: string;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  utilizationPercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AnalyticsTimeframe {
  label: string;
  value: '24h' | '7d' | '30d' | '90d' | '1y';
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: 'allocation_created' | 'allocation_updated' | 'allocation_deleted' | 'product_added' | 'product_updated' | 'client_added';
  entityType: 'allocation' | 'product' | 'client';
  entityId: string;
  performedBy: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface CapacityAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  alertType: 'high_utilization' | 'over_capacity' | 'low_utilization';
  severity: 'low' | 'medium' | 'high';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: Date;
  acknowledged: boolean;
}

export interface UtilizationTrend {
  date: string;
  utilization: number;
  capacity: number;
  allocations: number;
}

export interface ClientAnalytics {
  clientId: string;
  clientName: string;
  totalAllocations: number;
  totalCapacityUsed: number;
  averageUtilization: number;
  growthRate: number;
  lastActivity: Date;
}

export interface ZonePerformance {
  zoneId: string;
  zoneName: string;
  efficiency: number;
  throughput: number;
  averageAccessTime: number;
  maintenanceScore: number;
}

// Product Catalog Types
export interface ClientProduct {
  id: string;
  client_id: string;
  sku: string;
  product_name: string;
  description: string;
  category: string;
  dimensions_length: number; // inches
  dimensions_width: number; // inches  
  dimensions_height: number; // inches
  weight_lbs: number;
  cubic_feet: number; // calculated from dimensions
  storage_requirements: 'ambient' | 'refrigerated' | 'fragile' | 'hazardous';
  product_barcode: string; // Client's product barcode
  internal_barcode: string; // Our warehouse barcode PRD-[CLIENT_CODE]-[SKU]
  reorder_level: number;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Location Allocation Types
export interface ClientAllocation {
  id: string;
  client_id: string;
  allocation_type: 'zone' | 'row_range' | 'specific_bins';
  zone_id?: string; // if allocating entire zone
  start_row_id?: string; // if allocating row range
  end_row_id?: string; // if allocating row range
  specific_bin_ids?: string[]; // if allocating specific bins
  allocated_cubic_feet: number;
  allocation_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}