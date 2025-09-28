// Clean warehouse data for new 8-zone system

// Client data - updated for new zone system
export const clients = [
  {
    id: "1",
    name: "TechCorp",
    email: "contact@techcorp.com",
    type: "Technology Company",
    assignedFloorZone: "A",
    products: ["Laptops", "Monitors", "Keyboards", "Mouse"],
    totalValue: 125600,
    monthlyOrders: 45,
    color: "#3b82f6"
  },
  {
    id: "2", 
    name: "HealthPlus",
    email: "orders@healthplus.com",
    type: "Health & Wellness",
    assignedFloorZone: "B",
    products: ["Vitamin D", "Omega-3", "Multivitamins", "Protein Powder"],
    totalValue: 89400,
    monthlyOrders: 32,
    color: "#10b981"
  },
  {
    id: "3",
    name: "BeautyBrand",
    email: "warehouse@beautybrand.com",
    type: "Cosmetics Company",
    assignedFloorZone: "C",
    products: ["Face Cream", "Lipstick", "Foundation", "Moisturizer"],
    totalValue: 76300,
    monthlyOrders: 28,
    color: "#8b5cf6"
  },
  {
    id: "4",
    name: "SportGear",
    email: "supply@sportgear.com", 
    type: "Sporting Goods",
    assignedFloorZone: "D",
    products: ["Athletic Shoes", "Workout Clothes", "Sports Equipment"],
    totalValue: 94500,
    monthlyOrders: 38,
    color: "#f59e0b"
  },
  {
    id: "5",
    name: "HomeLiving",
    email: "info@homeliving.com",
    type: "Home & Garden", 
    assignedFloorZone: "E",
    products: ["Furniture", "Home Decor", "Kitchen Appliances"],
    totalValue: 112800,
    monthlyOrders: 22,
    color: "#ef4444"
  },
  // Zones F and G available for new clients
  // Zone Z rows can be allocated to any client for overflow or special storage
];

// Updated warehouse zones for new system
export const warehouseZones = [
  {
    id: "1",
    code: "A",
    name: "Zone A - TechCorp",
    description: "Floor zone dedicated to TechCorp client",
    zone_type: "floor" as const,
    client_id: "1",
    is_occupied: true,
    total_capacity: 500,
    used_capacity: 350,
    utilization: 70,
    color: "#3b82f6",
    totalValue: 125600,
    totalItems: 450
  },
  {
    id: "2",
    code: "B", 
    name: "Zone B - HealthPlus",
    description: "Floor zone dedicated to HealthPlus client",
    zone_type: "floor" as const,
    client_id: "2",
    is_occupied: true,
    total_capacity: 500,
    used_capacity: 280,
    utilization: 56,
    color: "#10b981",
    totalValue: 89400,
    totalItems: 320
  },
  {
    id: "3",
    code: "C",
    name: "Zone C - BeautyBrand", 
    description: "Floor zone dedicated to BeautyBrand client",
    zone_type: "floor" as const,
    client_id: "3",
    is_occupied: true,
    total_capacity: 500,
    used_capacity: 210,
    utilization: 42,
    color: "#8b5cf6",
    totalValue: 76300,
    totalItems: 180
  },
  {
    id: "4",
    code: "D",
    name: "Zone D - SportGear",
    description: "Floor zone dedicated to SportGear client", 
    zone_type: "floor" as const,
    client_id: "4",
    is_occupied: true,
    total_capacity: 500,
    used_capacity: 415,
    utilization: 83,
    color: "#f59e0b",
    totalValue: 94500,
    totalItems: 285
  },
  {
    id: "5",
    code: "E",
    name: "Zone E - HomeLiving",
    description: "Floor zone dedicated to HomeLiving client",
    zone_type: "floor" as const,
    client_id: "5",
    is_occupied: true,
    total_capacity: 500,
    used_capacity: 380,
    utilization: 76,
    color: "#ef4444",
    totalValue: 112800,
    totalItems: 195
  },
  {
    id: "6",
    code: "F",
    name: "Zone F - Available",
    description: "Floor zone available for new client assignment",
    zone_type: "floor" as const,
    client_id: null,
    is_occupied: false,
    total_capacity: 500,
    used_capacity: 0,
    utilization: 0,
    color: "#6b7280",
    totalValue: 0,
    totalItems: 0
  },
  {
    id: "7", 
    code: "G",
    name: "Zone G - Available",
    description: "Floor zone available for new client assignment",
    zone_type: "floor" as const,
    client_id: null,
    is_occupied: false,
    total_capacity: 500,
    used_capacity: 0,
    utilization: 0,
    color: "#6b7280",
    totalValue: 0,
    totalItems: 0
  },
  {
    id: "8",
    code: "Z",
    name: "Zone Z - Shelf Storage",
    description: "Multi-row shelf system for flexible storage",
    zone_type: "shelf" as const,
    client_id: null,
    is_occupied: true,
    total_capacity: 500, // 5 rows x 100 capacity each
    used_capacity: 180,
    utilization: 36,
    color: "#0ea5e9",
    totalValue: 45200,
    totalItems: 125,
    rows: [
      {
        id: "row1",
        row_number: "01",
        location_code: "ZONE-Z-ROW-01",
        barcode: "LOC-ZONE-Z-ROW-01",
        capacity: 100,
        used_capacity: 75,
        utilization: 75,
        client_id: "1", // TechCorp overflow
        is_occupied: true
      },
      {
        id: "row2", 
        row_number: "02",
        location_code: "ZONE-Z-ROW-02",
        barcode: "LOC-ZONE-Z-ROW-02",
        capacity: 100,
        used_capacity: 60,
        utilization: 60,
        client_id: "2", // HealthPlus overflow
        is_occupied: true
      },
      {
        id: "row3",
        row_number: "03", 
        location_code: "ZONE-Z-ROW-03",
        barcode: "LOC-ZONE-Z-ROW-03",
        capacity: 100,
        used_capacity: 45,
        utilization: 45,
        client_id: "3", // BeautyBrand overflow
        is_occupied: true
      },
      {
        id: "row4",
        row_number: "04",
        location_code: "ZONE-Z-ROW-04",
        barcode: "LOC-ZONE-Z-ROW-04",
        capacity: 100,
        used_capacity: 0,
        utilization: 0,
        client_id: null,
        is_occupied: false
      },
      {
        id: "row5",
        row_number: "05",
        location_code: "ZONE-Z-ROW-05", 
        barcode: "LOC-ZONE-Z-ROW-05",
        capacity: 100,
        used_capacity: 0,
        utilization: 0,
        client_id: null,
        is_occupied: false
      }
    ]
  }
];

// All warehouse locations for the new system
export const warehouseLocations = [
  // Floor Zones A-G (direct locations, no subdivisions)
  {
    id: "1",
    code: "ZONE-A",
    zone_id: "1",
    zone_name: "Zone A",
    type: "Floor Zone",
    status: "occupied" as const,
    utilization: 70,
    client: "TechCorp",
    items: 450,
    capacity: 500,
    barcode: "LOC-ZONE-A"
  },
  {
    id: "2", 
    code: "ZONE-B",
    zone_id: "2",
    zone_name: "Zone B",
    type: "Floor Zone",
    status: "occupied" as const,
    utilization: 56,
    client: "HealthPlus",
    items: 320,
    capacity: 500,
    barcode: "LOC-ZONE-B"
  },
  {
    id: "3",
    code: "ZONE-C",
    zone_id: "3", 
    zone_name: "Zone C",
    type: "Floor Zone",
    status: "occupied" as const,
    utilization: 42,
    client: "BeautyBrand",
    items: 180,
    capacity: 500,
    barcode: "LOC-ZONE-C"
  },
  {
    id: "4",
    code: "ZONE-D",
    zone_id: "4",
    zone_name: "Zone D",
    type: "Floor Zone",
    status: "occupied" as const,
    utilization: 83,
    client: "SportGear",
    items: 285,
    capacity: 500,
    barcode: "LOC-ZONE-D"
  },
  {
    id: "5",
    code: "ZONE-E",
    zone_id: "5",
    zone_name: "Zone E", 
    type: "Floor Zone",
    status: "occupied" as const,
    utilization: 76,
    client: "HomeLiving",
    items: 195,
    capacity: 500,
    barcode: "LOC-ZONE-E"
  },
  {
    id: "6",
    code: "ZONE-F",
    zone_id: "6",
    zone_name: "Zone F",
    type: "Floor Zone",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 500,
    barcode: "LOC-ZONE-F"
  },
  {
    id: "7",
    code: "ZONE-G",
    zone_id: "7", 
    zone_name: "Zone G",
    type: "Floor Zone",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 500,
    barcode: "LOC-ZONE-G"
  },
  // Zone Z Shelf Rows
  {
    id: "8",
    code: "ZONE-Z-ROW-01",
    zone_id: "8",
    zone_name: "Zone Z",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 75,
    client: "TechCorp",
    items: 75,
    capacity: 100,
    barcode: "LOC-ZONE-Z-ROW-01"
  },
  {
    id: "9",
    code: "ZONE-Z-ROW-02",
    zone_id: "8", 
    zone_name: "Zone Z",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 60,
    client: "HealthPlus", 
    items: 60,
    capacity: 100,
    barcode: "LOC-ZONE-Z-ROW-02"
  },
  {
    id: "10",
    code: "ZONE-Z-ROW-03",
    zone_id: "8",
    zone_name: "Zone Z",
    type: "Shelf Row",
    status: "occupied" as const,
    utilization: 45,
    client: "BeautyBrand",
    items: 45,
    capacity: 100,
    barcode: "LOC-ZONE-Z-ROW-03"
  },
  {
    id: "11",
    code: "ZONE-Z-ROW-04",
    zone_id: "8",
    zone_name: "Zone Z",
    type: "Shelf Row", 
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 100,
    barcode: "LOC-ZONE-Z-ROW-04"
  },
  {
    id: "12",
    code: "ZONE-Z-ROW-05",
    zone_id: "8",
    zone_name: "Zone Z",
    type: "Shelf Row",
    status: "available" as const,
    utilization: 0,
    client: null,
    items: 0,
    capacity: 100,
    barcode: "LOC-ZONE-Z-ROW-05"
  }
];

// Updated warehouse metrics for new system
export const warehouseMetrics = {
  totalZones: 8,
  floorZones: 7,
  shelfZone: 1,
  occupiedFloorZones: 5,
  availableFloorZones: 2,
  totalShelfRows: 5,
  occupiedShelfRows: 3,
  availableShelfRows: 2,
  totalLocations: 12,
  occupiedLocations: 8,
  availableLocations: 4,
  capacityUsed: 58.4,
  totalItems: 1610,
  totalCapacity: 4000
};

// Recent warehouse activities for new system
export const recentWarehouseActivities = [
  {
    id: "1",
    timestamp: "15 minutes ago",
    action: "Inventory received", 
    details: "65 units received in ZONE-A (TechCorp)",
    user: "Warehouse Staff",
    type: "receiving" as const,
    icon: "package"
  },
  {
    id: "2", 
    timestamp: "32 minutes ago", 
    action: "Order shipped",
    details: "Order ORD-2024001 shipped from ZONE-B and ZONE-Z-ROW-02",
    user: "Shipping Team",
    type: "shipping" as const,
    icon: "truck"
  },
  {
    id: "3",
    timestamp: "1 hour ago",
    action: "Zone F allocated", 
    details: "Zone F prepared for new client assignment",
    user: "Admin",
    type: "allocation" as const,
    icon: "map-pin"
  },
  {
    id: "4",
    timestamp: "2 hours ago",
    action: "Row added to Zone Z",
    details: "New row ZONE-Z-ROW-05 created in shelf zone", 
    user: "Warehouse Manager",
    type: "expansion" as const,
    icon: "plus-circle"
  },
  {
    id: "5",
    timestamp: "3 hours ago",
    action: "Inventory moved",
    details: "45 units moved from ZONE-D to ZONE-Z-ROW-01",
    user: "Warehouse Staff", 
    type: "movement" as const,
    icon: "refresh-cw"
  },
  {
    id: "6",
    timestamp: "4 hours ago",
    action: "Zone maintenance completed",
    details: "Scheduled maintenance completed for Zone C",
    user: "Maintenance Team",
    type: "maintenance" as const,
    icon: "wrench"
  }
];

// Updated pending orders for new system
export const pendingOrders = [
  {
    id: "ORD-2024001",
    client: "TechCorp", 
    items: [
      { product: "Laptops", quantity: 8, location: "ZONE-A" },
      { product: "Monitors", quantity: 12, location: "ZONE-Z-ROW-01" }
    ],
    priority: "high" as const,
    created: "2024-01-20T10:00:00Z"
  },
  {
    id: "ORD-2024002",
    client: "HealthPlus",
    items: [
      { product: "Vitamin D", quantity: 50, location: "ZONE-B" },
      { product: "Protein Powder", quantity: 15, location: "ZONE-Z-ROW-02" }
    ],
    priority: "normal" as const,
    created: "2024-01-20T09:30:00Z"
  },
  {
    id: "ORD-2024003", 
    client: "BeautyBrand",
    items: [
      { product: "Face Cream", quantity: 25, location: "ZONE-C" },
      { product: "Foundation", quantity: 18, location: "ZONE-Z-ROW-03" }
    ],
    priority: "normal" as const,
    created: "2024-01-20T08:45:00Z"
  }
];

// Products for receiving in new system
export const availableProducts = [
  { id: "1", name: "Laptops", sku: "LP001", category: "Technology", suggestedZone: "A" },
  { id: "2", name: "Vitamin D", sku: "VD001", category: "Health", suggestedZone: "B" },
  { id: "3", name: "Face Cream", sku: "FC001", category: "Beauty", suggestedZone: "C" },
  { id: "4", name: "Athletic Shoes", sku: "AS001", category: "Sports", suggestedZone: "D" },
  { id: "5", name: "Furniture", sku: "FU001", category: "Home", suggestedZone: "E" },
  { id: "6", name: "Mixed Items", sku: "MX001", category: "General", suggestedZone: "Z" }
];