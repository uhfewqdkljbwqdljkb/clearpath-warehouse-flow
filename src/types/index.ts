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