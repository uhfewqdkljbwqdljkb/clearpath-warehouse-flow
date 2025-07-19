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