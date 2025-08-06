// Warehouse zones with exact specifications
export const warehouseZones = [
  {
    id: "1",
    code: "SUP", 
    name: "Supplements",
    description: "Health supplements and nutrition products",
    total_locations: 3,
    occupied_locations: 2,
    utilization: 67,
    color: "#10b981", // Green
    locations: ["CLPRW0001", "CLPRW0002", "CLPRW0003"]
  },
  {
    id: "2",
    code: "GAD",
    name: "Gadgets", 
    description: "Electronics and tech accessories",
    total_locations: 7,
    occupied_locations: 5,
    utilization: 71,
    color: "#3b82f6", // Blue
    locations: ["CLPRW0004", "CLPRW0005", "CLPRW0006", "CLPRW0007", "CLPRW0008", "CLPCB0003", "CLPCB0005"]
  },
  {
    id: "3", 
    code: "BEA",
    name: "Beauty",
    description: "Cosmetics and personal care",
    total_locations: 2,
    occupied_locations: 1, 
    utilization: 50,
    color: "#8b5cf6", // Purple
    locations: ["CLPRW0009", "CLPRW0010"]
  },
  {
    id: "4",
    code: "MED", 
    name: "Medical Goods",
    description: "Medical supplies and pharmaceuticals",
    total_locations: 2,
    occupied_locations: 1,
    utilization: 50,
    color: "#ef4444", // Red
    locations: ["CLPRW0011", "CLPCB0004"]
  },
  {
    id: "5",
    code: "GEN",
    name: "General Goods", 
    description: "Miscellaneous and overflow items",
    total_locations: 2,
    occupied_locations: 0,
    utilization: 0,
    color: "#6b7280", // Gray
    locations: ["CLPCB0001", "CLPCB0002"]
  }
];

// All 16 warehouse locations with detailed information
export const warehouseLocations = [
  // Supplements Zone
  {
    id: "1",
    code: "CLPRW0001",
    zone_id: "1",
    zone_name: "Supplements",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 80,
    client: "HealthPlus",
    items: 120,
    capacity: 150,
    barcode: "LOC-CLPRW0001"
  },
  {
    id: "2", 
    code: "CLPRW0002",
    zone_id: "1",
    zone_name: "Supplements", 
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 65,
    client: "VitaStore",
    items: 95,
    capacity: 150,
    barcode: "LOC-CLPRW0002"
  },
  {
    id: "3",
    code: "CLPRW0003", 
    zone_id: "1",
    zone_name: "Supplements",
    type: "Shelf Row", 
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 150,
    barcode: "LOC-CLPRW0003"
  },

  // Gadgets Zone
  {
    id: "4",
    code: "CLPRW0004",
    zone_id: "2", 
    zone_name: "Gadgets",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 89,
    client: "TechStore",
    items: 134,
    capacity: 150,
    barcode: "LOC-CLPRW0004"
  },
  {
    id: "5",
    code: "CLPRW0005",
    zone_id: "2",
    zone_name: "Gadgets", 
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 72,
    client: "ElectroHub",
    items: 108,
    capacity: 150,
    barcode: "LOC-CLPRW0005"
  },
  {
    id: "6",
    code: "CLPRW0006",
    zone_id: "2",
    zone_name: "Gadgets",
    type: "Shelf Row",
    status: "occupied" as const, 
    utilization: 56,
    client: "GadgetWorld",
    items: 84,
    capacity: 150,
    barcode: "LOC-CLPRW0006"
  },
  {
    id: "7",
    code: "CLPRW0007",
    zone_id: "2",
    zone_name: "Gadgets",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 91,
    client: "TechMart", 
    items: 137,
    capacity: 150,
    barcode: "LOC-CLPRW0007"
  },
  {
    id: "8",
    code: "CLPRW0008",
    zone_id: "2",
    zone_name: "Gadgets",
    type: "Shelf Row", 
    status: "occupied" as const,
    utilization: 68,
    client: "DigitalPlus",
    items: 102,
    capacity: 150,
    barcode: "LOC-CLPRW0008"
  },
  {
    id: "9",
    code: "CLPCB0003",
    zone_id: "2",
    zone_name: "Gadgets",
    type: "Pallet Location",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 200,
    barcode: "LOC-CLPCB0003"
  },
  {
    id: "10",
    code: "CLPCB0005", 
    zone_id: "2",
    zone_name: "Gadgets",
    type: "Pallet Location",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 200,
    barcode: "LOC-CLPCB0005"
  },

  // Beauty Zone
  {
    id: "11",
    code: "CLPRW0009",
    zone_id: "3",
    zone_name: "Beauty",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 45,
    client: "BeautyBrand",
    items: 68,
    capacity: 150, 
    barcode: "LOC-CLPRW0009"
  },
  {
    id: "12",
    code: "CLPRW0010",
    zone_id: "3", 
    zone_name: "Beauty",
    type: "Shelf Row",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 150,
    barcode: "LOC-CLPRW0010"
  },

  // Medical Goods Zone
  {
    id: "13",
    code: "CLPRW0011",
    zone_id: "4",
    zone_name: "Medical Goods",
    type: "Shelf Row", 
    status: "occupied" as const,
    utilization: 34,
    client: "MedSupply",
    items: 51,
    capacity: 150,
    barcode: "LOC-CLPRW0011"
  },
  {
    id: "14",
    code: "CLPCB0004",
    zone_id: "4",
    zone_name: "Medical Goods",
    type: "Pallet Location",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 200,
    barcode: "LOC-CLPCB0004"
  },

  // General Goods Zone 
  {
    id: "15",
    code: "CLPCB0001",
    zone_id: "5",
    zone_name: "General Goods",
    type: "Pallet Location",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 200,
    barcode: "LOC-CLPCB0001"
  },
  {
    id: "16",
    code: "CLPCB0002",
    zone_id: "5", 
    zone_name: "General Goods",
    type: "Pallet Location",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 200,
    barcode: "LOC-CLPCB0002"
  }
];

// Warehouse metrics
export const warehouseMetrics = {
  totalLocations: 16,
  occupiedLocations: 9,
  availableLocations: 7,
  capacityUsed: 56.3,
  totalItems: 2847,
  totalCapacity: 2650
};

// Recent warehouse activities
export const recentWarehouseActivities = [
  {
    id: "1",
    timestamp: "10 minutes ago",
    action: "Inventory received", 
    details: "45 units added to CLPRW0004 (Gadgets)",
    user: "Warehouse Staff",
    type: "receiving" as const,
    icon: "package"
  },
  {
    id: "2", 
    timestamp: "25 minutes ago", 
    action: "Order picked",
    details: "Order ORD-12345 picked from CLPRW0001",
    user: "Picker Team",
    type: "shipping" as const,
    icon: "truck"
  },
  {
    id: "3",
    timestamp: "1 hour ago",
    action: "Location allocated", 
    details: "CLPRW0009 allocated to BeautyBrand client",
    user: "Admin",
    type: "allocation" as const,
    icon: "map-pin"
  },
  {
    id: "4",
    timestamp: "2 hours ago",
    action: "Inventory moved",
    details: "67 units moved from CLPRW0007 to CLPRW0005", 
    user: "Warehouse Staff",
    type: "movement" as const,
    icon: "refresh-cw"
  },
  {
    id: "5",
    timestamp: "3 hours ago",
    action: "Quality check completed",
    details: "QC passed for 89 items in CLPRW0002",
    user: "QC Team", 
    type: "quality" as const,
    icon: "check-circle"
  },
  {
    id: "6",
    timestamp: "4 hours ago",
    action: "Zone maintenance",
    details: "Scheduled maintenance completed for GAD zone",
    user: "Maintenance",
    type: "maintenance" as const,
    icon: "wrench"
  }
];

// Mock order data for shipping
export const pendingOrders = [
  {
    id: "ORD-12345",
    client: "TechStore", 
    items: [
      { product: "Wireless Mouse", quantity: 5, location: "CLPRW0004" },
      { product: "USB Cable", quantity: 10, location: "CLPRW0005" }
    ],
    priority: "high" as const,
    created: "2024-01-20T10:00:00Z"
  },
  {
    id: "ORD-12346",
    client: "HealthPlus",
    items: [
      { product: "Vitamin D", quantity: 20, location: "CLPRW0001" },
      { product: "Protein Powder", quantity: 3, location: "CLPRW0002" }
    ],
    priority: "normal" as const,
    created: "2024-01-20T09:30:00Z"
  },
  {
    id: "ORD-12347", 
    client: "BeautyBrand",
    items: [
      { product: "Face Cream", quantity: 8, location: "CLPRW0009" },
      { product: "Lipstick", quantity: 12, location: "CLPRW0009" }
    ],
    priority: "normal" as const,
    created: "2024-01-20T08:45:00Z"
  }
];

// Products for receiving
export const availableProducts = [
  { id: "1", name: "Wireless Mouse", sku: "WM001", category: "Gadgets", suggestedZone: "GAD" },
  { id: "2", name: "Vitamin D", sku: "VD001", category: "Supplements", suggestedZone: "SUP" },
  { id: "3", name: "Face Cream", sku: "FC001", category: "Beauty", suggestedZone: "BEA" },
  { id: "4", name: "Blood Pressure Monitor", sku: "BPM001", category: "Medical", suggestedZone: "MED" },
  { id: "5", name: "USB Cable", sku: "USB001", category: "Gadgets", suggestedZone: "GAD" },
  { id: "6", name: "Protein Powder", sku: "PP001", category: "Supplements", suggestedZone: "SUP" },
  { id: "7", name: "Lipstick", sku: "LS001", category: "Beauty", suggestedZone: "BEA" },
  { id: "8", name: "First Aid Kit", sku: "FAK001", category: "Medical", suggestedZone: "MED" }
];