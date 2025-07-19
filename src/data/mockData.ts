import { Product, InventoryItem, Order, Location } from '@/types';

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