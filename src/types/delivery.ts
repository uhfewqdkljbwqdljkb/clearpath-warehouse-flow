// Delivery Management System Types

export type DeliveryOrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'picked' 
  | 'packed' 
  | 'shipped' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'failed' 
  | 'returned' 
  | 'cancelled';

export type DeliverySource = 'manual' | 'shopify' | 'api' | 'b2b_portal' | 'b2c_portal';

export type DeliveryType = 'standard' | 'express' | 'same_day' | 'scheduled' | 'pickup';

export type CarrierType = 'international' | 'domestic' | 'local' | 'in_house';

export type DriverStatus = 'available' | 'on_delivery' | 'off_duty' | 'inactive';

export type PickStatus = 'pending' | 'picked' | 'partial' | 'out_of_stock';

export type TransactionType = 'revenue' | 'cost' | 'refund' | 'adjustment' | 'fee';

export type TransactionCategory = 
  | 'shipping_fee' 
  | 'fulfillment_fee' 
  | 'storage_fee' 
  | 'carrier_cost' 
  | 'labor_cost' 
  | 'packaging_cost' 
  | 'refund';

export type IntegrationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'setup_complete';

export type ShopifyIntegrationStatus = 'pending' | 'active' | 'paused' | 'disconnected' | 'error';

export interface DeliveryCarrier {
  id: string;
  name: string;
  code: string;
  carrier_type: CarrierType;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  api_enabled: boolean;
  api_endpoint?: string;
  api_settings: Record<string, any>;
  base_rate: number;
  per_kg_rate: number;
  pricing_zones: Record<string, any>;
  service_areas?: string[];
  estimated_days_domestic: number;
  estimated_days_international: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryDriver {
  id: string;
  carrier_id?: string;
  full_name: string;
  email?: string;
  phone: string;
  photo_url?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  status: DriverStatus;
  current_location?: {
    lat: number;
    lng: number;
    updated_at: string;
  };
  total_deliveries: number;
  successful_deliveries: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  carrier?: DeliveryCarrier;
}

export interface DeliveryOrder {
  id: string;
  order_number: string;
  company_id: string;
  check_out_request_id?: string;
  source: DeliverySource;
  external_order_id?: string;
  external_order_number?: string;
  recipient_name: string;
  recipient_email?: string;
  recipient_phone?: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country: string;
  delivery_type: DeliveryType;
  scheduled_date?: string;
  scheduled_time_slot?: string;
  delivery_instructions?: string;
  status: DeliveryOrderStatus;
  status_history: Array<{
    status: DeliveryOrderStatus;
    timestamp: string;
    note?: string;
  }>;
  carrier_id?: string;
  driver_id?: string;
  tracking_number?: string;
  tracking_url?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  fulfillment_cost: number;
  carrier_cost: number;
  packaging_cost: number;
  total_cost: number;
  profit_margin: number;
  confirmed_at?: string;
  picked_at?: string;
  packed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
  internal_notes?: string;
  tags?: string[];
  metadata: Record<string, any>;
  // Joined relations
  company?: {
    id: string;
    name: string;
    client_code?: string;
  };
  carrier?: DeliveryCarrier;
  driver?: DeliveryDriver;
  items?: DeliveryOrderItem[];
}

export interface DeliveryOrderItem {
  id: string;
  delivery_order_id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  variant_attribute?: string;
  variant_value?: string;
  sub_variant_attribute?: string;
  sub_variant_value?: string;
  quantity_ordered: number;
  quantity_picked: number;
  quantity_packed: number;
  quantity_shipped: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
  warehouse_location?: string;
  bin_location?: string;
  pick_status: PickStatus;
  created_at: string;
}

export interface DeliveryTrackingEvent {
  id: string;
  delivery_order_id: string;
  event_type: 'status_change' | 'location_update' | 'note_added' | 'exception' | 'delivery_attempt';
  event_status?: string;
  event_description: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  performed_by?: string;
  performer_name?: string;
  performer_role?: string;
  photo_urls?: string[];
  signature_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ShopifyIntegration {
  id: string;
  company_id: string;
  shop_domain: string;
  shop_name?: string;
  api_version: string;
  scopes?: string[];
  auto_sync_orders: boolean;
  auto_sync_inventory: boolean;
  sync_frequency_minutes: number;
  last_order_sync_at?: string;
  last_inventory_sync_at?: string;
  location_id?: string;
  product_mappings: Record<string, string>;
  webhooks_registered: Array<{ id: string; topic: string }>;
  status: ShopifyIntegrationStatus;
  last_error?: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    client_code?: string;
  };
}

export interface IntegrationRequest {
  id: string;
  company_id: string;
  integration_type: 'shopify' | 'woocommerce' | 'magento' | 'api_access';
  status: IntegrationStatus;
  shop_url?: string;
  request_notes?: string;
  technical_contact_email?: string;
  technical_contact_phone?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    client_code?: string;
  };
}

export interface FinancialTransaction {
  id: string;
  company_id?: string;
  delivery_order_id?: string;
  transaction_type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  description?: string;
  reference_number?: string;
  is_reconciled: boolean;
  reconciled_at?: string;
  transaction_date: string;
  created_at: string;
  company?: {
    id: string;
    name: string;
  };
  delivery_order?: {
    id: string;
    order_number: string;
  };
}

export interface PricingRule {
  id: string;
  rule_name: string;
  rule_type: 'shipping' | 'fulfillment' | 'storage' | 'handling';
  applies_to: 'all' | 'b2b' | 'b2c' | 'specific_client';
  company_id?: string;
  conditions: {
    min_weight?: number;
    max_weight?: number;
    zone?: string;
    delivery_type?: DeliveryType;
    min_value?: number;
    max_value?: number;
  };
  calculation_type: 'flat' | 'per_unit' | 'per_kg' | 'percentage' | 'tiered';
  base_amount: number;
  per_unit_amount: number;
  percentage: number;
  tiers: Array<{ min: number; max: number; rate: number }>;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

// Dashboard metrics
export interface DeliveryMetrics {
  ordersToday: number;
  ordersTodayChange: number;
  ordersInTransit: number;
  pendingFulfillment: number;
  deliverySuccessRate: number;
  totalRevenue: number;
  revenueChange: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalCosts: number;
  costsChange: number;
  grossProfit: number;
  profitMargin: number;
  ordersProcessed: number;
  averageOrderValue: number;
}

// Filter types
export interface DeliveryOrderFilters {
  status?: DeliveryOrderStatus[];
  source?: DeliverySource[];
  companyId?: string;
  carrierId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasIssues?: boolean;
  search?: string;
}

export interface FinancialFilters {
  dateFrom?: string;
  dateTo?: string;
  transactionType?: TransactionType[];
  category?: TransactionCategory[];
  companyId?: string;
  isReconciled?: boolean;
  search?: string;
}
