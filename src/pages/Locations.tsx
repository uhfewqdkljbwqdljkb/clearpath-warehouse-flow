import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getAllZones, 
  getRowsByZone, 
  getBinsByRow, 
  searchLocations, 
  getWarehouseStats,
  lookupByBarcode,
  generateMissingBarcodes 
} from '@/services/warehouseService';
import { Zone, Row, Bin, WarehouseStats, LocationSearchResult } from '@/types/warehouse';
import { Search, MapPin, Package, Warehouse, BarChart3 } from 'lucide-react';

export const Locations = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult | null>(null);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [barcodeResult, setBarcodeResult] = useState<Bin | null>(null);

  useEffect(() => {
    loadZones();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      loadRows(selectedZone.id);
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedRow) {
      loadBins(selectedRow.id);
    }
  }, [selectedRow]);

  const loadZones = () => {
    setZones(getAllZones());
  };

  const loadRows = (zoneId: string) => {
    setRows(getRowsByZone(zoneId));
    setSelectedRow(null);
    setBins([]);
  };

  const loadBins = (rowId: string) => {
    setBins(getBinsByRow(rowId));
  };

  const loadStats = () => {
    setStats(getWarehouseStats());
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchLocations(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  const handleBarcodeSearch = () => {
    if (barcodeQuery.trim()) {
      const result = lookupByBarcode(barcodeQuery);
      setBarcodeResult(result);
    } else {
      setBarcodeResult(null);
    }
  };

  const handleGenerateBarcodes = () => {
    const count = generateMissingBarcodes();
    alert(`Generated ${count} missing barcodes`);
    loadStats();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Warehouse Locations</h1>
        <Button onClick={handleGenerateBarcodes} variant="outline">
          Generate Missing Barcodes
        </Button>
      </div>

      {/* Warehouse Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_zones}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bins</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_bins}</div>
              <p className="text-xs text-muted-foreground">
                {stats.available_bins} available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancy_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.occupied_bins} of {stats.total_bins} bins
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_capacity.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">cubic feet</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Locations</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="barcode">Barcode Lookup</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zones */}
            <Card>
              <CardHeader>
                <CardTitle>Zones ({zones.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                      selectedZone?.id === zone.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedZone(zone)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Zone {zone.code}</div>
                        <div className="text-sm text-muted-foreground">{zone.name}</div>
                      </div>
                      <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Rows */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Rows {selectedZone ? `in Zone ${selectedZone.code}` : ''} ({rows.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedZone ? (
                  rows.map(row => (
                    <div
                      key={row.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedRow?.id === row.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedRow(row)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{row.row_code}</div>
                          <div className="text-sm text-muted-foreground">
                            Max {row.max_bins} bins
                          </div>
                        </div>
                        <Badge variant={row.is_active ? 'default' : 'secondary'}>
                          {row.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Select a zone to view rows</p>
                )}
              </CardContent>
            </Card>

            {/* Bins */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Bins {selectedRow ? `in Row ${selectedRow.row_code}` : ''} ({bins.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {selectedRow ? (
                  bins.map(bin => (
                    <div key={bin.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{bin.location_code}</div>
                          <div className="text-sm text-muted-foreground">
                            {bin.barcode} • {bin.capacity_cubic_feet} ft³
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={bin.is_occupied ? 'destructive' : 'default'}>
                            {bin.is_occupied ? 'Occupied' : 'Available'}
                          </Badge>
                          <Badge variant={bin.is_active ? 'default' : 'secondary'}>
                            {bin.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Select a row to view bins</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by zone, row, bin, or location code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  {searchResults.zones.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Zones ({searchResults.zones.length})</h3>
                      <div className="grid gap-2">
                        {searchResults.zones.map(zone => (
                          <div key={zone.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Zone {zone.code} - {zone.name}</div>
                                <div className="text-sm text-muted-foreground">{zone.description}</div>
                              </div>
                              <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                                {zone.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.rows.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Rows ({searchResults.rows.length})</h3>
                      <div className="grid gap-2">
                        {searchResults.rows.map(row => (
                          <div key={row.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{row.row_code}</div>
                                <div className="text-sm text-muted-foreground">Max {row.max_bins} bins</div>
                              </div>
                              <Badge variant={row.is_active ? 'default' : 'secondary'}>
                                {row.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.bins.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Bins ({searchResults.bins.length})</h3>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {searchResults.bins.map(bin => (
                          <div key={bin.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{bin.location_code}</div>
                                <div className="text-sm text-muted-foreground">
                                  {bin.barcode} • {bin.capacity_cubic_feet} ft³
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={bin.is_occupied ? 'destructive' : 'default'}>
                                  {bin.is_occupied ? 'Occupied' : 'Available'}
                                </Badge>
                                <Badge variant={bin.is_active ? 'default' : 'secondary'}>
                                  {bin.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Barcode Lookup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode (e.g., LOC-A01-05)..."
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                />
                <Button onClick={handleBarcodeSearch}>
                  Lookup
                </Button>
              </div>

              {barcodeResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Location Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><strong>Location:</strong> {barcodeResult.location_code}</div>
                      <div><strong>Barcode:</strong> {barcodeResult.barcode}</div>
                      <div><strong>Capacity:</strong> {barcodeResult.capacity_cubic_feet} ft³</div>
                      <div className="flex gap-2">
                        <Badge variant={barcodeResult.is_occupied ? 'destructive' : 'default'}>
                          {barcodeResult.is_occupied ? 'Occupied' : 'Available'}
                        </Badge>
                        <Badge variant={barcodeResult.is_active ? 'default' : 'secondary'}>
                          {barcodeResult.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {barcodeQuery && !barcodeResult && barcodeQuery.length > 5 && (
                <div className="text-muted-foreground">
                  No location found for barcode: {barcodeQuery}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};