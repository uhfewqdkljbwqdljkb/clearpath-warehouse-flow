
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Package, ClipboardList, AlertTriangle, TruckIcon, MapPin, Activity, Search, Filter, MoreHorizontal } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-[15px]">
      {/* Dynamic Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dynamic Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">7,391</div>
                  <div className="text-sm font-medium text-success">+18.4%</div>
                  <div className="text-sm text-muted-foreground">Last 6 months</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">5,698</div>
                  <div className="text-sm font-medium text-destructive">-4.5%</div>
                  <div className="text-sm text-muted-foreground">Last 4 months</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">1,243</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">945</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dynamic Statistics</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">Last 6 months</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end justify-between space-x-1">
                {[40, 60, 35, 80, 45, 70, 55].map((height, i) => (
                  <div key={i} className="bg-destructive rounded-sm flex-1" style={{height: `${height}%`}}></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Chart */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">D4H123236794</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">View Details</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 200 100">
                  <polyline 
                    fill="none" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth="2" 
                    points="10,80 40,60 70,70 100,40 130,50 160,30 190,20"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipping Location */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Shipping Location</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">Last 6 months</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded flex items-center justify-center relative">
                <div className="text-xs text-muted-foreground">Map View</div>
                <div className="absolute top-2 left-2 w-3 h-3 bg-destructive rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center"><div className="w-2 h-2 bg-destructive rounded-full mr-2"></div>New York</span>
                  <span>342</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center"><div className="w-2 h-2 bg-muted-foreground rounded-full mr-2"></div>California</span>
                  <span>180</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Revenue */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Shipping Revenue</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">This Year</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center relative">
                <div className="w-24 h-24 rounded-full border-8 border-destructive border-r-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">$473,265</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="w-full h-2 bg-destructive rounded mb-1"></div>
                  <div>40%</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-muted rounded mb-1"></div>
                  <div>35%</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-muted-foreground rounded mb-1"></div>
                  <div>25%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipment History */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shipment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Los Angeles, CA , USA</div>
                    <div className="text-xs text-muted-foreground">09:30 AM</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-muted-foreground rounded-sm"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Delivered</div>
                    <div className="text-xs text-muted-foreground">Package dispatched from Pacific</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-muted-foreground rounded-sm"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Package Received on Post Pacific</div>
                    <div className="text-xs text-muted-foreground">07:45 AM</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Shipment Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Shipment</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="ghost" size="sm">
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
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 font-medium">#ORD-001</td>
                  <td className="py-3">Anuhea Hi</td>
                  <td className="py-3">2024-01-15</td>
                  <td className="py-3">Los Angeles, CA - Orange, CA</td>
                  <td className="py-3">$30.00</td>
                  <td className="py-3"><Badge variant="destructive">IN PROGRESS</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">#ORD-002</td>
                  <td className="py-3">Eduardo Jo</td>
                  <td className="py-3">2024-01-14</td>
                  <td className="py-3">Los Angeles, CA - Orange, CA</td>
                  <td className="py-3">$25.00</td>
                  <td className="py-3"><Badge variant="secondary">DELIVERED</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">#ORD-003</td>
                  <td className="py-3">Alexandra</td>
                  <td className="py-3">2024-01-13</td>
                  <td className="py-3">Detroit, MI - Atlanta, GA</td>
                  <td className="py-3">$45.00</td>
                  <td className="py-3"><Badge variant="secondary">DELIVERED</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">#ORD-004</td>
                  <td className="py-3">JamesGoff</td>
                  <td className="py-3">2024-01-12</td>
                  <td className="py-3">Dallas, TX - Atlanta, GA</td>
                  <td className="py-3">$35.00</td>
                  <td className="py-3"><Badge>SHIPPING</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">#ORD-005</td>
                  <td className="py-3">JohnsonIs</td>
                  <td className="py-3">2024-01-11</td>
                  <td className="py-3">Orange, CA - Birmingham, AL</td>
                  <td className="py-3">$50.00</td>
                  <td className="py-3"><Badge variant="secondary">DELIVERED</Badge></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">#ORD-006</td>
                  <td className="py-3">ChesterGall</td>
                  <td className="py-3">2024-01-10</td>
                  <td className="py-3">Orange, CA - Birmingham, AL</td>
                  <td className="py-3">$40.00</td>
                  <td className="py-3"><Badge variant="outline">CANCELLED</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center mt-1">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm">New order #ORD-007 has been placed by customer John Smith</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mt-1">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm">Package dispatched from Pacific Distribution Center</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mt-1">
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm">Order #ORD-004 out for delivery to Dallas, TX</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm">New delivery route optimized for Los Angeles area</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
