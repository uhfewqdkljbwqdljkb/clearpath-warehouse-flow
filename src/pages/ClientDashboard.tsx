import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  TrendingUp, 
  MapPin, 
  AlertTriangle, 
  Bell,
  User,
  Calendar,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  FileText,
  BarChart3,
  Truck,
  Clock,
  CheckCircle,
  RefreshCw,
  DollarSign,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter
} from 'lucide-react';
import { 
  currentClient, 
  clientMetrics, 
  clientInventory, 
  topSellingProducts,
  myAllocations,
  orderPipeline,
  recentMessages,
  clientKPIs,
  restockRecommendations
} from '@/data/clientData';

export const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'backorder': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVelocityIcon = (velocity: string) => {
    switch (velocity.toLowerCase()) {
      case 'fast': return '🔥';
      case 'medium': return '📈';
      case 'slow': return '📊';
      default: return '📊';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentClient.name}</h1>
                <p className="text-sm text-gray-600">Account Manager: {currentClient.accountManager}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Today: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Next Shipment: {currentClient.nextShipment}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {currentClient.notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {currentClient.notifications}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(clientMetrics).map(([key, metric]) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: metric.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.breakdown}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-green-600 font-medium">{metric.trend} {metric.subtitle}</span>
                <Button size="sm" variant="ghost" className="h-auto p-0 text-xs text-blue-600">
                  {metric.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">My Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Top Sellers</TabsTrigger>
          <TabsTrigger value="storage">My Storage</TabsTrigger>
          <TabsTrigger value="orders">Live Orders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Operational Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{clientKPIs.operationalMetrics.orderAccuracy}%</div>
                    <div className="text-sm text-green-600">Order Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{clientKPIs.operationalMetrics.fulfillmentSpeed}h</div>
                    <div className="text-sm text-blue-600">Avg Fulfillment</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">{clientKPIs.operationalMetrics.stockAccuracy}%</div>
                    <div className="text-sm text-purple-600">Stock Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700">{clientKPIs.operationalMetrics.onTimeDelivery}%</div>
                    <div className="text-sm text-emerald-600">On-Time Delivery</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Business Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Inventory Turnover</span>
                    <span className="font-bold">{clientKPIs.businessMetrics.inventoryTurnover}x/year</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Storage Efficiency</span>
                    <span className="font-bold">{clientKPIs.businessMetrics.storageEfficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cost per Order</span>
                    <span className="font-bold">${clientKPIs.businessMetrics.costPerOrder}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold">{clientKPIs.businessMetrics.customerSatisfaction}/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span>Growth Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Growth</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">+{clientKPIs.growthMetrics.monthlyGrowth}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Products</span>
                    <span className="font-bold">+{clientKPIs.growthMetrics.newProducts} SKUs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Storage Expansion</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-blue-600">+{clientKPIs.growthMetrics.storageExpansion}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Order Volume</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUpRight className="h-4 w-4 text-purple-500" />
                      <span className="font-bold text-purple-600">+{clientKPIs.growthMetrics.orderVolume}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Recent Messages</span>
                </div>
                <Button size="sm" variant="outline">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMessages.slice(0, 3).map((message) => (
                  <div key={message.id} className={`p-3 rounded-lg border ${message.status === 'unread' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{message.from}</span>
                          <Badge variant={message.status === 'unread' ? 'default' : 'secondary'} className="text-xs">
                            {message.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">{message.subject}</p>
                        <p className="text-sm text-gray-600 mt-1">{message.preview}</p>
                      </div>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">$45,230</div>
                  <div className="text-sm text-gray-600">Total Inventory Value</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">3.2x</div>
                  <div className="text-sm text-gray-600">Average Turnover</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">23</div>
                  <div className="text-sm text-gray-600">Fast Moving Items</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">12</div>
                  <div className="text-sm text-gray-600">Restock Needed</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory Overview</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-900">Product</th>
                      <th className="text-left p-3 font-medium text-gray-900">SKU</th>
                      <th className="text-left p-3 font-medium text-gray-900">Stock</th>
                      <th className="text-left p-3 font-medium text-gray-900">Available</th>
                      <th className="text-left p-3 font-medium text-gray-900">Velocity</th>
                      <th className="text-left p-3 font-medium text-gray-900">Status</th>
                      <th className="text-left p-3 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientInventory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{item.product}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{item.sku}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{item.currentStock}</div>
                            <div className="text-sm text-gray-500">Reserved: {item.reserved}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={item.available < 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {item.available}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <span>{getVelocityIcon(item.velocity)}</span>
                            <span className="text-sm">{item.velocity}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">View</Button>
                            {item.status === 'Low' || item.status === 'Backorder' ? (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                Reorder
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline">Reorder</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Restock Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Smart Restock Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {restockRecommendations.map((rec) => (
                  <div key={rec.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{rec.product}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.reasoning}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-gray-600">Suggested: <span className="font-medium">{rec.suggestedOrder} units</span></span>
                          <span className="text-gray-600">Cost: <span className="font-medium">${rec.cost.toLocaleString()}</span></span>
                          <span className="text-gray-600">Lead Time: <span className="font-medium">{rec.leadTime}</span></span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={rec.urgency.includes('today') || rec.urgency.includes('now') ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                          {rec.urgency}
                        </Badge>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          Order Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span>Top Performing Products (Last 30 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellingProducts.map((product) => (
                  <div key={product.rank} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                          #{product.rank}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{product.product}</h4>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">${product.revenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{product.unitsSold} units sold</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{product.margin}%</div>
                        <div className="text-sm text-gray-600">Margin</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{product.trend}</div>
                        <div className="text-sm text-gray-600">Growth</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{product.stockDays}</div>
                        <div className="text-sm text-gray-600">Days Stock</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Badge className={getUrgencyColor(product.urgency)}>
                          {product.urgency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          {/* Storage Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{myAllocations.totalAllocated}</div>
                  <div className="text-sm text-gray-600">Total Allocated</div>
                  <Progress value={myAllocations.utilization} className="mt-2" />
                  <div className="text-sm text-gray-600 mt-1">{myAllocations.utilization}% utilized</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">${myAllocations.monthlyCost}</div>
                  <div className="text-sm text-gray-600">Monthly Cost</div>
                  <div className="text-xs text-green-600 mt-1">-$150 utilization bonus</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {myAllocations.zones.reduce((sum, zone) => sum + zone.products, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Product Types</div>
                  <div className="text-xs text-gray-500 mt-1">Across {myAllocations.zones.length} zones</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myAllocations.zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span>{zone.zone}</span>
                    </CardTitle>
                    <Badge variant="outline">{zone.utilization}% used</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{zone.products}</div>
                      <div className="text-sm text-gray-600">Products</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{zone.items}</div>
                      <div className="text-sm text-gray-600">Items</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">${zone.monthlyCost}</div>
                      <div className="text-sm text-gray-600">Monthly</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">My Locations</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {zone.locations.map((location) => (
                        <div key={location} className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                          <div className="text-sm font-medium text-blue-900">{location}</div>
                          <div className="text-xs text-blue-600">{Math.floor(Math.random() * 30 + 50)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Top Products</h4>
                    <div className="flex flex-wrap gap-1">
                      {zone.topProducts.map((product) => (
                        <Badge key={product} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Progress value={zone.utilization} />
                  <div className="text-sm text-gray-600">
                    {zone.used} of {zone.allocated} used
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expansion Options */}
          <Card>
            <CardHeader>
              <CardTitle>Available for Expansion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAllocations.availableForExpansion.map((option, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{option.location}</h4>
                        <p className="text-sm text-gray-600">{option.zone}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">${option.cost}/month</div>
                        <Button size="sm" variant="outline" className="mt-2">
                          Request
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Order Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(orderPipeline).map(([status, data]) => {
              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
                  case 'picking': return <RefreshCw className="h-5 w-5 text-blue-600" />;
                  case 'packed': return <Package className="h-5 w-5 text-purple-600" />;
                  case 'shipped': return <Truck className="h-5 w-5 text-green-600" />;
                  default: return <Clock className="h-5 w-5" />;
                }
              };

              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'pending': return 'border-yellow-200 bg-yellow-50';
                  case 'picking': return 'border-blue-200 bg-blue-50';
                  case 'packed': return 'border-purple-200 bg-purple-50';
                  case 'shipped': return 'border-green-200 bg-green-50';
                  default: return 'border-gray-200 bg-gray-50';
                }
              };

              return (
                <Card key={status} className={getStatusColor(status)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </div>
                      <Badge variant="outline">{data.count}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.orders.slice(0, 2).map((order: any) => (
                        <div key={order.id} className="p-2 bg-white rounded border border-gray-200">
                          <div className="text-sm font-medium">{order.id}</div>
                          <div className="text-xs text-gray-600">{order.customer}</div>
                          <div className="text-xs text-gray-500">{order.items} items • ${order.value}</div>
                        </div>
                      ))}
                      {data.count > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{data.count - 2} more orders
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Live Order Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-900">Order #</th>
                      <th className="text-left p-3 font-medium text-gray-900">Customer</th>
                      <th className="text-left p-3 font-medium text-gray-900">Items</th>
                      <th className="text-left p-3 font-medium text-gray-900">Status</th>
                      <th className="text-left p-3 font-medium text-gray-900">Location</th>
                      <th className="text-left p-3 font-medium text-gray-900">ETA</th>
                      <th className="text-left p-3 font-medium text-gray-900">Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...orderPipeline.picking.orders.map((order: any) => ({ ...order, status: 'picking', location: 'CLPRW0004', eta: order.eta, tracking: '-' })),
                      ...orderPipeline.packed.orders.map((order: any) => ({ ...order, status: 'packed', location: 'Shipping', eta: '2 hours', tracking: '-' })),
                      ...orderPipeline.shipped.orders.map((order: any) => ({ ...order, status: 'shipped', location: 'In Transit', eta: 'Tomorrow', tracking: order.tracking }))
                    ].map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium text-blue-600">{order.id}</td>
                        <td className="p-3">{order.customer}</td>
                        <td className="p-3">{order.items} items</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {order.status === 'picking' && <RefreshCw className="h-4 w-4 text-blue-600" />}
                            {order.status === 'packed' && <Package className="h-4 w-4 text-purple-600" />}
                            {order.status === 'shipped' && <Truck className="h-4 w-4 text-green-600" />}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </td>
                        <td className="p-3">{order.location}</td>
                        <td className="p-3">{order.eta}</td>
                        <td className="p-3">
                          {order.tracking !== '-' ? (
                            <Badge variant="outline">{order.tracking}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center space-y-2">
              <Phone className="h-5 w-5" />
              <span>Call Warehouse</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <MessageSquare className="h-5 w-5" />
              <span>Send Message</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Report Issue</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-5 w-5" />
              <span>Request Report</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Available Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Inventory Turnover Report", description: "Product performance analysis", icon: BarChart3 },
              { title: "Storage Utilization Report", description: "Space efficiency metrics", icon: MapPin },
              { title: "Order Fulfillment Report", description: "Processing time analytics", icon: Clock },
              { title: "Cost Analysis Report", description: "Storage and handling costs", icon: DollarSign },
              { title: "Demand Forecasting", description: "Predictive inventory planning", icon: TrendingUp },
              { title: "Custom Export", description: "Create your own report", icon: FileText }
            ].map((report, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <report.icon className="h-6 w-6 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{report.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <Button size="sm" className="w-full">Generate Report</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-5 w-5" />
                  <span>Excel Export</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-5 w-5" />
                  <span>PDF Reports</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-5 w-5" />
                  <span>CSV Data</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                  <Mail className="h-5 w-5" />
                  <span>Email Schedule</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};