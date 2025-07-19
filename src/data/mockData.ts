import { Product, InventoryItem, Order, Location, Client } from '@/types';

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
