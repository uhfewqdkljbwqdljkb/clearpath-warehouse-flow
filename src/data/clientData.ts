// Client-specific data for TechShop Electronics
export const currentClient = {
  id: "techshop-001",
  name: "TechShop Electronics",
  accountManager: "Sarah Johnson",
  email: "contact@techshop.com",
  phone: "+961-1-234567",
  memberSince: "2023-01-15",
  tier: "Premium",
  nextShipment: "Tomorrow",
  notifications: 3
};

export const clientMetrics = {
  totalProducts: {
    label: "Products in Stock",
    value: "1,247",
    breakdown: "89 SKUs",
    trend: "+15%",
    subtitle: "vs last month",
    action: "View Inventory",
    color: "#10b981"
  },
  activeOrders: {
    label: "Active Orders", 
    value: "23",
    breakdown: "156 items",
    trend: "+8%", 
    subtitle: "vs last week",
    action: "Track Orders",
    color: "#3b82f6"
  },
  storageUsed: {
    label: "Storage Utilization",
    value: "68.5%",
    breakdown: "4.2 of 6.1 m³",
    trend: "+5%",
    subtitle: "monthly avg",
    action: "View Locations",
    color: "#8b5cf6"
  },
  lowStockAlerts: {
    label: "Low Stock Items",
    value: "12",
    breakdown: "Need restocking",
    trend: "🔴 Urgent",
    subtitle: "action required", 
    action: "Restock Now",
    color: "#ef4444"
  }
};

export const clientInventory = [
  {
    id: "1",
    product: "iPhone Cases",
    sku: "TC-001",
    currentStock: 450,
    reserved: 23,
    available: 427,
    velocity: "Fast",
    status: "Good",
    reorderPoint: 100,
    location: "CLPRW0004",
    value: 4500,
    lastRestocked: "2024-01-10",
    supplier: "CaseTech Inc"
  },
  {
    id: "2", 
    product: "Wireless Earbuds",
    sku: "TC-002",
    currentStock: 12,
    reserved: 8,
    available: 4,
    velocity: "Fast",
    status: "Low",
    reorderPoint: 50,
    location: "CLPRW0005",
    value: 840,
    lastRestocked: "2024-01-05",
    supplier: "AudioTech Co"
  },
  {
    id: "3",
    product: "Phone Camera Lens",
    sku: "TC-003", 
    currentStock: 89,
    reserved: 5,
    available: 84,
    velocity: "Medium",
    status: "Good",
    reorderPoint: 30,
    location: "CLPRW0004",
    value: 1780,
    lastRestocked: "2024-01-08",
    supplier: "OpticsPro Ltd"
  },
  {
    id: "4",
    product: "USB Chargers",
    sku: "TC-004",
    currentStock: 3,
    reserved: 15,
    available: -12,
    velocity: "Fast", 
    status: "Backorder",
    reorderPoint: 75,
    location: "CLPRW0005",
    value: 45,
    lastRestocked: "2023-12-28",
    supplier: "PowerTech Systems"
  },
  {
    id: "5",
    product: "Screen Protectors",
    sku: "TC-007",
    currentStock: 234,
    reserved: 12,
    available: 222,
    velocity: "Medium",
    status: "Good",
    reorderPoint: 50,
    location: "CLPRW0006",
    value: 1404,
    lastRestocked: "2024-01-12",
    supplier: "ProtectPlus Co"
  }
];

export const topSellingProducts = [
  {
    rank: 1,
    product: "Wireless Earbuds Pro",
    sku: "TC-002",
    unitsSold: 234,
    revenue: 11700,
    margin: 45,
    trend: "+23%",
    stockDays: 3,
    urgency: "critical",
    weeklyGrowth: 15,
    monthlyGrowth: 23
  },
  {
    rank: 2, 
    product: "Phone Screen Protector",
    sku: "TC-007",
    unitsSold: 189,
    revenue: 3780,
    margin: 65,
    trend: "+8%",
    stockDays: 45,
    urgency: "good",
    weeklyGrowth: 8,
    monthlyGrowth: 12
  },
  {
    rank: 3,
    product: "iPhone Cases Premium",
    sku: "TC-001",
    unitsSold: 156,
    revenue: 7800,
    margin: 55,
    trend: "+12%",
    stockDays: 30,
    urgency: "good",
    weeklyGrowth: 5,
    monthlyGrowth: 18
  },
  {
    rank: 4,
    product: "USB-C Chargers",
    sku: "TC-004",
    unitsSold: 145,
    revenue: 2175,
    margin: 40,
    trend: "+45%",
    stockDays: 1,
    urgency: "critical",
    weeklyGrowth: 25,
    monthlyGrowth: 45
  }
];

export const myAllocations = {
  totalAllocated: "6.1 m³",
  totalUsed: "4.2 m³", 
  utilization: 68.5,
  monthlyCost: 1250,
  zones: [
    {
      id: "1",
      zone: "Gadgets Zone",
      locations: ["CLPRW0004", "CLPRW0005", "CLPRW0006"],
      allocated: "4.5 m³",
      used: "3.1 m³", 
      utilization: 69,
      products: 45,
      items: 789,
      topProducts: ["iPhone Cases", "Chargers", "Earbuds"],
      monthlyCost: 900,
      color: "#3b82f6"
    },
    {
      id: "2",
      zone: "General Goods", 
      locations: ["CLPCB0001"],
      allocated: "1.6 m³",
      used: "1.1 m³",
      utilization: 67,
      products: 12,
      items: 156,
      topProducts: ["Large Electronics", "Bulk Items"],
      monthlyCost: 350,
      color: "#6b7280"
    }
  ],
  availableForExpansion: [
    { location: "CLPRW0007", zone: "Gadgets Zone", cost: 150 },
    { location: "CLPCB0002", zone: "General Zone", cost: 200 }
  ]
};

export const orderPipeline = {
  pending: {
    count: 8,
    orders: [
      { id: "ORD-12345", customer: "John Doe", items: 3, value: 145, created: "2 hours ago" },
      { id: "ORD-12346", customer: "Jane Smith", items: 5, value: 230, created: "3 hours ago" },
      { id: "ORD-12347", customer: "Tech Corp", items: 7, value: 420, created: "4 hours ago" }
    ],
    avgProcessingTime: "2.3 hours",
    nextAction: "Will start picking at 2:00 PM"
  },
  picking: {
    count: 5, 
    orders: [
      { id: "ORD-12340", customer: "Mike Electronics", items: 4, value: 180, picker: "Mike", eta: "30 min" },
      { id: "ORD-12341", customer: "Digital Store", items: 6, value: 310, picker: "Sarah", eta: "45 min" }
    ],
    currentStatus: "Active picking in progress",
    estimatedCompletion: "3:30 PM today"
  },
  packed: {
    count: 4,
    orders: [
      { id: "ORD-12335", customer: "Express Tech", items: 8, value: 450, packed: "1 hour ago" },
      { id: "ORD-12336", customer: "Phone Plus", items: 3, value: 125, packed: "2 hours ago" }
    ],  
    currentStatus: "Ready for carrier pickup",
    scheduledPickup: "5:00 PM today"
  },
  shipped: {
    count: 6,
    orders: [
      { id: "ORD-12330", customer: "Mobile World", items: 5, value: 275, carrier: "Aramex", tracking: "AR123456" },
      { id: "ORD-12331", customer: "Gadget Hub", items: 2, value: 95, carrier: "LibanPost", tracking: "LP789012" }
    ],
    carriers: ["Aramex", "LibanPost"],
    avgDeliveryTime: "1.2 days"
  }
};

export const recentMessages = [
  {
    id: "1",
    timestamp: "2 hours ago",
    from: "Warehouse Team",
    subject: "Shipment Received",
    preview: "Your 150-unit iPhone case shipment has been received and stored in CLPRW0004...",
    status: "unread",
    type: "info"
  },
  {
    id: "2",
    timestamp: "Yesterday", 
    from: "You",
    subject: "Rush Order Request",
    preview: "Can you expedite order ORD-12340? Customer needs it by tomorrow...",
    status: "replied",
    type: "request"
  },
  {
    id: "3",
    timestamp: "2 days ago",
    from: "Account Manager",
    subject: "Monthly Report Ready",
    preview: "Your January performance report is available for download...",
    status: "read",
    type: "report"
  }
];

export const clientKPIs = {
  operationalMetrics: {
    orderAccuracy: 99.2,
    fulfillmentSpeed: 4.2,
    stockAccuracy: 98.7, 
    onTimeDelivery: 96.5
  },
  businessMetrics: {
    inventoryTurnover: 8.3,
    storageEfficiency: 68.5,
    costPerOrder: 3.45,
    customerSatisfaction: 4.8
  },
  growthMetrics: {
    monthlyGrowth: 15,
    newProducts: 8,
    storageExpansion: 20,
    orderVolume: 23
  }
};

export const restockRecommendations = [
  {
    id: "1",
    product: "Wireless Earbuds Pro",
    sku: "TC-002",
    currentStock: 12,
    suggestedOrder: 500,
    reasoning: "High velocity (15/day), 3 days stock left",
    urgency: "Order today",
    supplier: "AudioTech Co",
    leadTime: "5-7 days",
    cost: 2500,
    roi: "High"
  },
  {
    id: "2",
    product: "USB-C Chargers", 
    sku: "TC-004",
    currentStock: 3,
    suggestedOrder: 300,
    reasoning: "Fastest moving item, critical shortage",
    urgency: "Urgent - Order now",
    supplier: "PowerTech Systems",
    leadTime: "3-5 days",
    cost: 1200,
    roi: "Very High"
  }
];