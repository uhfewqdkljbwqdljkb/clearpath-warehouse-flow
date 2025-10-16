import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Warehouse as WarehouseIcon, 
  MapPin, 
  Search,
  Plus,
  Users,
  Box,
  ChevronDown,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WarehouseMetricsCard } from '@/components/WarehouseMetricsCard';

export const Warehouse: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [zoneDetails, setZoneDetails] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      // Fetch zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('warehouse_zones')
        .select('*')
        .order('code');

      if (zonesError) throw zonesError;

      // Fetch rows with zone information
      const { data: rowsData, error: rowsError } = await supabase
        .from('warehouse_rows')
        .select(`
          *,
          warehouse_zones (
            id,
            name,
            code,
            color
          ),
          companies:assigned_company_id (
            id,
            name,
            client_code
          )
        `)
        .order('row_number');

      if (rowsError) throw rowsError;

      // Fetch allocations with client and product information
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('client_allocations')
        .select(`
          *,
          companies (
            id,
            name,
            client_code
          )
        `);

      if (allocationsError) throw allocationsError;

      setZones(zonesData || []);
      setRows(rowsData || []);
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouse data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchZoneDetails = async (zoneId: string) => {
    if (zoneDetails.has(zoneId)) return zoneDetails.get(zoneId);

    try {
      // Fetch allocations for this zone
      const { data: allocations, error: allocError } = await supabase
        .from('client_allocations')
        .select(`
          *,
          companies (
            id,
            name,
            client_code
          )
        `)
        .eq('assigned_floor_zone_id', zoneId);

      if (allocError) throw allocError;

      // Fetch rows in this zone
      const { data: zoneRows, error: rowsError } = await supabase
        .from('warehouse_rows')
        .select(`
          *,
          companies:assigned_company_id (
            id,
            name,
            client_code
          )
        `)
        .eq('zone_id', zoneId);

      if (rowsError) throw rowsError;

      // Get unique company IDs from both allocations and rows
      const companyIds = new Set([
        ...(allocations?.map(a => a.companies?.id).filter(Boolean) || []),
        ...(zoneRows?.map(r => r.companies?.id).filter(Boolean) || [])
      ]);

      // Fetch products for all companies in this zone
      const productsPromises = Array.from(companyIds).map(companyId =>
        supabase
          .from('client_products')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
      );

      const productsResults = await Promise.all(productsPromises);
      const productsByCompany = new Map();
      
      Array.from(companyIds).forEach((companyId, index) => {
        productsByCompany.set(companyId, productsResults[index].data || []);
      });

      const details = {
        allocations: allocations || [],
        rows: zoneRows || [],
        productsByCompany
      };

      setZoneDetails(prev => new Map(prev).set(zoneId, details));
      return details;
    } catch (error) {
      console.error('Error fetching zone details:', error);
      toast({
        title: "Error",
        description: "Failed to load zone details",
        variant: "destructive",
      });
      return null;
    }
  };

  // Calculate metrics
  const totalZones = zones.length;
  const activeZones = zones.filter(z => z.is_active).length;
  const totalRows = rows.length;
  const occupiedRows = rows.filter(r => r.is_occupied).length;

  const filteredZones = zones.filter(zone =>
    zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRows = rows.filter(row =>
    row.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.row_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Operations</h1>
          <p className="text-muted-foreground">
            Manage warehouse zones, rows, and storage capacity
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <WarehouseMetricsCard
          title="Total Zones"
          value={totalZones.toString()}
          subtitle={`${activeZones} active`}
          icon={WarehouseIcon}
        />
        <WarehouseMetricsCard
          title="Total Rows"
          value={totalRows.toString()}
          subtitle={`${occupiedRows} occupied`}
          icon={Box}
        />
      </div>

      {/* Warehouse Tabs */}
      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Floor Zones</TabsTrigger>
          <TabsTrigger value="rows">Shelf Rows</TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Floor Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Floor Zones ({filteredZones.length})</CardTitle>
              <CardDescription>
                Dedicated floor zones for client storage - Click to view assigned clients and products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading zones...</div>
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No zones found matching your search.' : 'No zones configured yet.'}
                  </div>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredZones.map((zone) => (
                    <AccordionItem key={zone.id} value={zone.id}>
                      <AccordionTrigger 
                        className="hover:no-underline"
                        onClick={() => fetchZoneDetails(zone.id)}
                      >
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: zone.color }}
                            />
                            <div className="text-left">
                              <div className="font-medium">{zone.code} - {zone.name}</div>
                              <div className="text-sm text-muted-foreground">
                                <Badge variant="outline" className="mr-2">{zone.zone_type}</Badge>
                                <Badge variant={zone.is_active ? "default" : "secondary"}>
                                  {zone.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ZoneDetailsContent zoneId={zone.id} details={zoneDetails.get(zone.id)} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shelf Rows Tab */}
        <TabsContent value="rows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shelf Rows ({filteredRows.length})</CardTitle>
              <CardDescription>
                Individual shelf rows for shared client storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading rows...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No rows found matching your search.' : 'No rows configured yet.'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row Code</TableHead>
                      <TableHead>Row Number</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.code}</TableCell>
                        <TableCell>Row {row.row_number}</TableCell>
                        <TableCell>
                          {row.warehouse_zones ? (
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: row.warehouse_zones.color }}
                              />
                              <span className="text-sm">{row.warehouse_zones.code}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.companies ? (
                            <div>
                              <div className="text-sm font-medium">{row.companies.name}</div>
                              <div className="text-xs text-muted-foreground">{row.companies.client_code}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <Badge variant={row.is_active ? "default" : "secondary"}>
                              {row.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {row.is_occupied && (
                              <Badge variant="outline" className="text-xs">
                                Occupied
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Zone Details Component
const ZoneDetailsContent: React.FC<{ zoneId: string; details: any }> = ({ zoneId, details }) => {
  if (!details) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading zone details...</div>
      </div>
    );
  }

  const { allocations, rows, productsByCompany } = details;

  // Get all unique companies from both allocations and rows
  const companies = new Map();
  
  allocations.forEach((alloc: any) => {
    if (alloc.companies) {
      companies.set(alloc.companies.id, {
        ...alloc.companies,
        allocationType: 'floor_zone'
      });
    }
  });

  rows.forEach((row: any) => {
    if (row.companies) {
      companies.set(row.companies.id, {
        ...row.companies,
        allocationType: 'shelf_row',
        rowNumber: row.row_number
      });
    }
  });

  if (companies.size === 0) {
    return (
      <div className="py-6 px-4 text-center text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No clients assigned to this zone</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {Array.from(companies.values()).map((company: any) => {
        const products = productsByCompany.get(company.id) || [];
        
        return (
          <div key={company.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{company.name}</span>
                  <Badge variant="outline">{company.client_code}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {company.allocationType === 'floor_zone' ? 'Full Zone Allocation' : `Row ${company.rowNumber}`}
                </p>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Products ({products.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-start space-x-2 text-sm p-2 bg-muted/50 rounded">
                      <Box className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{product.name}</div>
                        {product.sku && (
                          <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                        )}
                        {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic mt-2">
                No products registered for this client
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};