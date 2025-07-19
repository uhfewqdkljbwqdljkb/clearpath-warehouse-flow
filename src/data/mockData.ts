import { Product, InventoryItem, Order, Location, Client, ClientProduct, ClientAllocation } from '@/types';

export const mockProducts: Product[] = [
  {
    id: 1,
    sku: 'WH001',
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones',
    category: 'Electronics',
    reorderLevel: 10,
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    sku: 'MUG001',
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug - 12oz',
    category: 'Kitchen',
    reorderLevel: 25,
    createdAt: '2024-01-14',
  },
  {
    id: 3,
    sku: 'KB001',
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard',
    category: 'Electronics',
    reorderLevel: 5,
    createdAt: '2024-01-13',
  },
  {
    id: 4,
    sku: 'PEN001',
    name: 'Ballpoint Pen',
    description: 'Blue ink ballpoint pen',
    category: 'Office Supplies',
    reorderLevel: 50,
    createdAt: '2024-01-12',
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 1,
    productId: 1,
    quantity: 50,
    locationRow: 'A',
    locationBin: '1',
    lastUpdated: '2024-01-15',
  },
  {
    id: 2,
    productId: 2,
    quantity: 8,
    locationRow: 'B',
    locationBin: '3',
    lastUpdated: '2024-01-14',
  },
  {
    id: 3,
    productId: 3,
    quantity: 3,
    locationRow: 'A',
    locationBin: '5',
    lastUpdated: '2024-01-13',
  },
  {
    id: 4,
    productId: 4,
    quantity: 120,
    locationRow: 'C',
    locationBin: '2',
    lastUpdated: '2024-01-12',
  },
];

export const mockOrders: Order[] = [
  {
    id: 1,
    clientId: 2,
    orderNumber: 'ORD-001',
    status: 'picking',
    createdDate: '2024-01-15',
    totalItems: 3,
    clientName: 'ACME Corporation',
  },
  {
    id: 2,
    clientId: 2,
    orderNumber: 'ORD-002',
    status: 'pending',
    createdDate: '2024-01-14',
    totalItems: 5,
    clientName: 'ACME Corporation',
  },
  {
    id: 3,
    clientId: 2,
    orderNumber: 'ORD-003',
    status: 'shipped',
    createdDate: '2024-01-13',
    shippedDate: '2024-01-14',
    totalItems: 2,
    clientName: 'ACME Corporation',
  },
];

export const mockLocations: Location[] = [
  { id: 1, rowNumber: 'A', binNumber: '1', zone: 'Electronics', isActive: true },
  { id: 2, rowNumber: 'A', binNumber: '2', zone: 'Electronics', isActive: true },
  { id: 3, rowNumber: 'A', binNumber: '3', zone: 'Electronics', isActive: true },
  { id: 4, rowNumber: 'A', binNumber: '4', zone: 'Electronics', isActive: true },
  { id: 5, rowNumber: 'A', binNumber: '5', zone: 'Electronics', isActive: true },
  { id: 6, rowNumber: 'B', binNumber: '1', zone: 'Kitchen', isActive: true },
  { id: 7, rowNumber: 'B', binNumber: '2', zone: 'Kitchen', isActive: true },
  { id: 8, rowNumber: 'B', binNumber: '3', zone: 'Kitchen', isActive: true },
  { id: 9, rowNumber: 'C', binNumber: '1', zone: 'Office', isActive: true },
  { id: 10, rowNumber: 'C', binNumber: '2', zone: 'Office', isActive: true },
];

// Helper function to get inventory with product details
export const getInventoryWithProducts = () => {
  return mockInventory.map(item => ({
    ...item,
    product: mockProducts.find(p => p.id === item.productId),
  }));
};

// Helper function to get low stock items
export const getLowStockItems = () => {
  return getInventoryWithProducts().filter(item => 
    item.product && item.quantity <= item.product.reorderLevel
  );
};

// Add new dashboard metrics
export const dashboardMetrics = {
  totalItems: 2394,
  activeOrders: 156,
  pendingOrders: 23,
  lowStockItems: 18,
  inventoryValue: 473265,
  trends: {
    totalItems: { value: 12, type: 'positive' as const },
    activeOrders: { value: 8, type: 'positive' as const },
    pendingOrders: { value: -5, type: 'negative' as const },
    lowStockItems: { value: 3, type: 'neutral' as const },
  }
};

// Enhanced orders data
export const enhancedOrders = [
  {
    id: 'ORD-001',
    client: 'ABC Store',
    status: 'In Progress',
    items: 12,
    amount: 450,
    createdDate: '2024-01-15',
  },
  {
    id: 'ORD-002',
    client: 'XYZ Corp',
    status: 'Shipped',
    items: 8,
    amount: 320,
    createdDate: '2024-01-14',
  },
  {
    id: 'ORD-003',
    client: 'DEF Ltd',
    status: 'Pending',
    items: 15,
    amount: 675,
    createdDate: '2024-01-13',
  },
];

// Activity feed data
export const recentActivities = [
  { action: 'Inventory updated for SKU-12345', time: '2 minutes ago' },
  { action: 'Order ORD-001 shipped to Los Angeles, CA', time: '15 minutes ago' },
  { action: 'Low stock alert for Product ABC', time: '1 hour ago' },
  { action: 'New order received from Client XYZ', time: '2 hours ago' },
  { action: 'Warehouse Zone A maintenance completed', time: '3 hours ago' },
  { action: 'Order ORD-002 picked and ready for shipping', time: '4 hours ago' },
];

// Sample Clients for Phase 2
export const mockClients: Client[] = [
  {
    id: "1",
    client_code: "CLT001",
    company_name: "TechShop Electronics",
    contact_name: "John Smith",
    email: "john@techshop.com",
    phone: "+1-555-0123",
    address: "123 Tech Street, San Francisco, CA 94105",
    billing_address: "123 Tech Street, San Francisco, CA 94105",
    contract_start_date: "2024-01-01",
    contract_end_date: "2024-12-31",
    storage_plan: "premium",
    max_storage_cubic_feet: 5000,
    monthly_fee: 2500,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    client_code: "CLT002",
    company_name: "Fashion Forward",
    contact_name: "Sarah Johnson",
    email: "sarah@fashionforward.com",
    phone: "+1-555-0456",
    address: "456 Fashion Ave, New York, NY 10001",
    billing_address: "456 Fashion Ave, New York, NY 10001",
    contract_start_date: "2024-02-01",
    contract_end_date: "2025-01-31",
    storage_plan: "enterprise",
    max_storage_cubic_feet: 8000,
    monthly_fee: 4000,
    is_active: true,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z"
  },
  {
    id: "3",
    client_code: "CLT003",
    company_name: "Home Essentials",
    contact_name: "Mike Wilson",
    email: "mike@homeessentials.com",
    phone: "+1-555-0789",
    address: "789 Home Blvd, Los Angeles, CA 90210",
    billing_address: "789 Home Blvd, Los Angeles, CA 90210",
    contract_start_date: "2024-03-01",
    contract_end_date: "2024-08-31",
    storage_plan: "basic",
    max_storage_cubic_feet: 2000,
    monthly_fee: 1200,
    is_active: true,
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z"
  },
  {
    id: "4",
    client_code: "CLT004",
    company_name: "Global Imports",
    contact_name: "Lisa Chen",
    email: "lisa@globalimports.com",
    phone: "+1-555-0321",
    address: "321 Import Dr, Seattle, WA 98101",
    billing_address: "321 Import Dr, Seattle, WA 98101",
    contract_start_date: "2023-12-01",
    contract_end_date: "2024-11-30",
    storage_plan: "premium",
    max_storage_cubic_feet: 6000,
    monthly_fee: 3200,
    is_active: false,
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  }
];

// Sample Products per Client
export const mockClientProducts: ClientProduct[] = [
  // TechShop Electronics Products
  {
    id: "1",
    client_id: "1",
    sku: "TS-WH001",
    product_name: "Wireless Headphones",
    description: "Premium noise-canceling wireless headphones with 30-hour battery life",
    category: "Audio",
    dimensions_length: 8,
    dimensions_width: 6,
    dimensions_height: 3,
    weight_lbs: 1.2,
    cubic_feet: 1.0, // calculated: 8*6*3 / 1728
    storage_requirements: "ambient",
    product_barcode: "123456789012",
    internal_barcode: "PRD-CLT001-TS-WH001",
    reorder_level: 10,
    cost_per_unit: 89.99,
    is_active: true,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    client_id: "1",
    sku: "TS-PH002",
    product_name: "Smartphone Case",
    description: "Protective case for iPhone 15 Pro with built-in screen protector",
    category: "Accessories",
    dimensions_length: 6,
    dimensions_width: 3,
    dimensions_height: 1,
    weight_lbs: 0.3,
    cubic_feet: 0.01, // 6*3*1 / 1728
    storage_requirements: "ambient",
    product_barcode: "123456789013",
    internal_barcode: "PRD-CLT001-TS-PH002",
    reorder_level: 25,
    cost_per_unit: 24.99,
    is_active: true,
    created_at: "2024-01-16T00:00:00Z",
    updated_at: "2024-01-16T00:00:00Z"
  },
  {
    id: "3",
    client_id: "1",
    sku: "TS-CH003",
    product_name: "Fast Charging Cable",
    description: "USB-C to Lightning fast charging cable 6ft length",
    category: "Accessories",
    dimensions_length: 4,
    dimensions_width: 2,
    dimensions_height: 1,
    weight_lbs: 0.2,
    cubic_feet: 0.005, // 4*2*1 / 1728
    storage_requirements: "ambient",
    product_barcode: "123456789014",
    internal_barcode: "PRD-CLT001-TS-CH003",
    reorder_level: 50,
    cost_per_unit: 19.99,
    is_active: true,
    created_at: "2024-01-17T00:00:00Z",
    updated_at: "2024-01-17T00:00:00Z"
  },

  // Fashion Forward Products
  {
    id: "4",
    client_id: "2",
    sku: "FF-TS001",
    product_name: "Cotton T-Shirt",
    description: "100% organic cotton t-shirt in various colors and sizes",
    category: "Apparel",
    dimensions_length: 12,
    dimensions_width: 8,
    dimensions_height: 2,
    weight_lbs: 0.5,
    cubic_feet: 0.11, // 12*8*2 / 1728
    storage_requirements: "ambient",
    product_barcode: "234567890123",
    internal_barcode: "PRD-CLT002-FF-TS001",
    reorder_level: 20,
    cost_per_unit: 15.99,
    is_active: true,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z"
  },
  {
    id: "5",
    client_id: "2",
    sku: "FF-JE002",
    product_name: "Denim Jeans",
    description: "Premium stretch denim jeans with sustainable fabric",
    category: "Apparel",
    dimensions_length: 14,
    dimensions_width: 10,
    dimensions_height: 3,
    weight_lbs: 1.1,
    cubic_feet: 0.24, // 14*10*3 / 1728
    storage_requirements: "ambient",
    product_barcode: "234567890124",
    internal_barcode: "PRD-CLT002-FF-JE002",
    reorder_level: 15,
    cost_per_unit: 79.99,
    is_active: true,
    created_at: "2024-02-02T00:00:00Z",
    updated_at: "2024-02-02T00:00:00Z"
  },

  // Home Essentials Products
  {
    id: "6",
    client_id: "3",
    sku: "HE-MG001",
    product_name: "Ceramic Coffee Mug",
    description: "Handcrafted ceramic coffee mug with ergonomic handle",
    category: "Kitchen",
    dimensions_length: 4,
    dimensions_width: 4,
    dimensions_height: 4,
    weight_lbs: 0.8,
    cubic_feet: 0.037, // 4*4*4 / 1728
    storage_requirements: "fragile",
    product_barcode: "345678901234",
    internal_barcode: "PRD-CLT003-HE-MG001",
    reorder_level: 30,
    cost_per_unit: 12.99,
    is_active: true,
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z"
  },
  {
    id: "7",
    client_id: "3",
    sku: "HE-CL002",
    product_name: "Kitchen Cleaner",
    description: "Eco-friendly all-purpose kitchen cleaner spray",
    category: "Cleaning",
    dimensions_length: 8,
    dimensions_width: 3,
    dimensions_height: 10,
    weight_lbs: 1.5,
    cubic_feet: 0.14, // 8*3*10 / 1728
    storage_requirements: "hazardous",
    product_barcode: "345678901235",
    internal_barcode: "PRD-CLT003-HE-CL002",
    reorder_level: 40,
    cost_per_unit: 8.99,
    is_active: true,
    created_at: "2024-03-02T00:00:00Z",
    updated_at: "2024-03-02T00:00:00Z"
  }
];

// Helper functions for product management
export const getProductsByClient = (clientId: string) => {
  return mockClientProducts.filter(product => product.client_id === clientId);
};

export const generateInternalBarcode = (clientCode: string, sku: string) => {
  return `PRD-${clientCode}-${sku}`;
};

export const calculateCubicFeet = (length: number, width: number, height: number) => {
  return Math.round((length * width * height / 1728) * 1000) / 1000; // Round to 3 decimal places
};

// Sample Client Allocations
export const mockClientAllocations: ClientAllocation[] = [
  // TechShop Electronics gets entire Zone A (electronics storage)
  {
    id: "1",
    client_id: "1", // TechShop Electronics
    allocation_type: "zone",
    zone_id: "A",
    allocated_cubic_feet: 5000,
    allocation_date: "2024-01-15",
    is_active: true,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  // Fashion Forward gets rows B01-B07 in Zone B
  {
    id: "2",
    client_id: "2", // Fashion Forward
    allocation_type: "row_range",
    zone_id: "B",
    start_row_id: "B01",
    end_row_id: "B07",
    allocated_cubic_feet: 3500,
    allocation_date: "2024-02-01",
    is_active: true,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z"
  },
  // Home Essentials gets rows C01-C04 in Zone C
  {
    id: "3",
    client_id: "3", // Home Essentials
    allocation_type: "row_range",
    zone_id: "C",
    start_row_id: "C01",
    end_row_id: "C04",
    allocated_cubic_feet: 2000,
    allocation_date: "2024-03-01",
    is_active: true,
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z"
  },
  // Global Imports had specific bins (now inactive)
  {
    id: "4",
    client_id: "4", // Global Imports
    allocation_type: "specific_bins",
    zone_id: "D",
    specific_bin_ids: ["D01-01", "D01-02", "D01-03", "D02-01", "D02-02"],
    allocated_cubic_feet: 1200,
    allocation_date: "2023-12-01",
    is_active: false,
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  }
];

// Enhanced warehouse zones with allocation tracking
export const warehouseZones = [
  {
    id: "A",
    name: "Zone A - Electronics",
    total_rows: 10,
    bins_per_row: 15,
    cubic_feet_per_bin: 50,
    total_cubic_feet: 7500,
    allocated_cubic_feet: 5000,
    client_id: "1", // TechShop Electronics
    allocation_type: "zone"
  },
  {
    id: "B", 
    name: "Zone B - Apparel",
    total_rows: 12,
    bins_per_row: 12,
    cubic_feet_per_bin: 40,
    total_cubic_feet: 5760,
    allocated_cubic_feet: 3500,
    client_id: "2", // Fashion Forward (partial)
    allocation_type: "row_range"
  },
  {
    id: "C",
    name: "Zone C - Home & Garden", 
    total_rows: 8,
    bins_per_row: 10,
    cubic_feet_per_bin: 45,
    total_cubic_feet: 3600,
    allocated_cubic_feet: 2000,
    client_id: "3", // Home Essentials (partial)
    allocation_type: "row_range"
  },
  {
    id: "D",
    name: "Zone D - General Storage",
    total_rows: 15,
    bins_per_row: 20,
    cubic_feet_per_bin: 35,
    total_cubic_feet: 10500,
    allocated_cubic_feet: 0, // Available
    client_id: null,
    allocation_type: null
  }
];

// Helper functions for allocation management
export const getAllocationsByClient = (clientId: string) => {
  return mockClientAllocations.filter(allocation => 
    allocation.client_id === clientId && allocation.is_active
  );
};

export const getAvailableZones = () => {
  const allocatedZones = mockClientAllocations
    .filter(a => a.is_active && a.allocation_type === 'zone')
    .map(a => a.zone_id);
  
  return warehouseZones.filter(zone => !allocatedZones.includes(zone.id));
};

export const checkAllocationConflict = (
  zoneId: string, 
  allocationType: string, 
  startRow?: string, 
  endRow?: string,
  specificBins?: string[]
) => {
  const existingAllocations = mockClientAllocations.filter(a => 
    a.is_active && a.zone_id === zoneId
  );

  // Check for zone-level conflicts
  if (allocationType === 'zone') {
    return existingAllocations.length > 0;
  }

  // Check for row range conflicts
  if (allocationType === 'row_range' && startRow && endRow) {
    return existingAllocations.some(allocation => {
      if (allocation.allocation_type === 'zone') return true;
      if (allocation.allocation_type === 'row_range') {
        // Check if ranges overlap
        return !(endRow < allocation.start_row_id! || startRow > allocation.end_row_id!);
      }
      return false;
    });
  }

  return false;
};

export const calculateZoneUtilization = (zoneId: string) => {
  const zone = warehouseZones.find(z => z.id === zoneId);
  if (!zone) return 0;
  
  return Math.round((zone.allocated_cubic_feet / zone.total_cubic_feet) * 100);
};
