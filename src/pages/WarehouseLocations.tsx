import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MapPin,
  Layers,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Zone {
  id: string;
  code: string;
  name: string;
  zone_type: string;
  color: string;
  is_active: boolean;
  created_at: string;
  assigned_company?: {
    id: string;
    name: string;
    client_code: string;
  } | null;
}

interface Row {
  id: string;
  row_number: string;
  code: string;
  zone_id: string;
  is_active: boolean;
  is_occupied: boolean;
  created_at: string;
  warehouse_zones?: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
  companies?: {
    id: string;
    name: string;
    client_code: string;
  } | null;
}

export const WarehouseLocations: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Zone dialog state
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    code: '',
    name: '',
    color: '#3B82F6',
    is_active: true
  });

  // Row dialog state
  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [rowForm, setRowForm] = useState({
    row_number: '',
    code: '',
    is_active: true
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'zone' | 'row'; item: Zone | Row } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch zones with assigned companies
      const { data: zonesData, error: zonesError } = await supabase
        .from('warehouse_zones')
        .select('*')
        .eq('zone_type', 'floor')
        .order('code');

      if (zonesError) throw zonesError;

      // Get companies assigned to floor zones
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, client_code, assigned_floor_zone_id')
        .not('assigned_floor_zone_id', 'is', null);

      // Map companies to zones
      const zonesWithCompanies = (zonesData || []).map(zone => {
        const assignedCompany = companiesData?.find(c => c.assigned_floor_zone_id === zone.id);
        return {
          ...zone,
          assigned_company: assignedCompany ? {
            id: assignedCompany.id,
            name: assignedCompany.name,
            client_code: assignedCompany.client_code
          } : null
        };
      });

      // Fetch rows with zone and company info
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

      // Sort rows numerically
      const sortedRows = (rowsData || []).sort((a, b) => {
        const numA = parseInt(a.row_number) || 0;
        const numB = parseInt(b.row_number) || 0;
        return numA - numB;
      });

      setZones(zonesWithCompanies);
      setRows(sortedRows as Row[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouse locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Zone CRUD operations
  const openZoneDialog = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneForm({
        code: zone.code || '',
        name: zone.name || '',
        color: zone.color || '#3B82F6',
        is_active: zone.is_active
      });
    } else {
      setEditingZone(null);
      setZoneForm({
        code: '',
        name: '',
        color: '#3B82F6',
        is_active: true
      });
    }
    setZoneDialogOpen(true);
  };

  const saveZone = async () => {
    try {
      if (!zoneForm.code || !zoneForm.name) {
        toast({
          title: "Validation Error",
          description: "Code and name are required",
          variant: "destructive",
        });
        return;
      }

      // Check code uniqueness (only for new zones or if code changed)
      if (!editingZone || editingZone.code !== zoneForm.code) {
        const { data: existing } = await supabase
          .from('warehouse_zones')
          .select('id')
          .eq('code', zoneForm.code.toUpperCase())
          .maybeSingle();

        if (existing) {
          toast({
            title: "Validation Error",
            description: "Zone code already exists",
            variant: "destructive",
          });
          return;
        }
      }

      if (editingZone) {
        // Update existing zone
        const { error } = await supabase
          .from('warehouse_zones')
          .update({
            code: zoneForm.code.toUpperCase(),
            name: zoneForm.name,
            color: zoneForm.color,
            is_active: zoneForm.is_active
          })
          .eq('id', editingZone.id);

        if (error) throw error;
        toast({ title: "Success", description: "Zone updated successfully" });
      } else {
        // Create new zone
        const { error } = await supabase
          .from('warehouse_zones')
          .insert({
            code: zoneForm.code.toUpperCase(),
            name: zoneForm.name,
            color: zoneForm.color,
            zone_type: 'floor',
            is_active: zoneForm.is_active
          });

        if (error) throw error;
        toast({ title: "Success", description: "Zone created successfully" });
      }

      setZoneDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving zone:', error);
      toast({
        title: "Error",
        description: "Failed to save zone",
        variant: "destructive",
      });
    }
  };

  // Row CRUD operations
  const openRowDialog = async (row?: Row) => {
    if (row) {
      setEditingRow(row);
      setRowForm({
        row_number: row.row_number || '',
        code: row.code || '',
        is_active: row.is_active
      });
    } else {
      // Get next row number
      const nextNumber = await getNextRowNumber();
      const code = `Z-ROW-${nextNumber}`;
      setEditingRow(null);
      setRowForm({
        row_number: nextNumber,
        code: code,
        is_active: true
      });
    }
    setRowDialogOpen(true);
  };

  const getNextRowNumber = async (): Promise<string> => {
    const { data } = await supabase
      .from('warehouse_rows')
      .select('row_number')
      .order('row_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNum = data ? parseInt(data.row_number) + 1 : 1;
    return nextNum.toString().padStart(2, '0');
  };

  const getShelfZoneId = async (): Promise<string | null> => {
    const { data } = await supabase
      .from('warehouse_zones')
      .select('id')
      .eq('zone_type', 'shelf')
      .eq('is_active', true)
      .maybeSingle();

    return data?.id || null;
  };

  const saveRow = async () => {
    try {
      if (!rowForm.row_number || !rowForm.code) {
        toast({
          title: "Validation Error",
          description: "Row number and code are required",
          variant: "destructive",
        });
        return;
      }

      // Get or create shelf zone
      let shelfZoneId = await getShelfZoneId();
      
      if (!shelfZoneId) {
        // Create Zone Z if it doesn't exist
        const { data: newZone, error: zoneError } = await supabase
          .from('warehouse_zones')
          .insert({
            code: 'Z',
            name: 'Zone Z - Shelf Storage',
            zone_type: 'shelf',
            color: '#0ea5e9',
            is_active: true
          })
          .select()
          .single();

        if (zoneError) throw zoneError;
        shelfZoneId = newZone.id;
      }

      if (editingRow) {
        // Update existing row
        const { error } = await supabase
          .from('warehouse_rows')
          .update({
            row_number: rowForm.row_number,
            code: rowForm.code,
            is_active: rowForm.is_active
          })
          .eq('id', editingRow.id);

        if (error) throw error;
        toast({ title: "Success", description: "Row updated successfully" });
      } else {
        // Create new row
        const { error } = await supabase
          .from('warehouse_rows')
          .insert({
            row_number: rowForm.row_number,
            code: rowForm.code,
            zone_id: shelfZoneId,
            is_active: rowForm.is_active,
            is_occupied: false
          });

        if (error) throw error;
        toast({ title: "Success", description: "Row created successfully" });
      }

      setRowDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving row:', error);
      toast({
        title: "Error",
        description: "Failed to save row",
        variant: "destructive",
      });
    }
  };

  // Delete operations
  const confirmDelete = (type: 'zone' | 'row', item: Zone | Row) => {
    setItemToDelete({ type, item });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'zone') {
        const zone = itemToDelete.item as Zone;
        
        // Check if zone is assigned to a client
        if (zone.assigned_company) {
          toast({
            title: "Cannot Delete",
            description: "This zone is assigned to a client. Unassign the client first.",
            variant: "destructive",
          });
          setDeleteDialogOpen(false);
          return;
        }

        const { error } = await supabase
          .from('warehouse_zones')
          .delete()
          .eq('id', zone.id);

        if (error) throw error;
        toast({ title: "Success", description: "Zone deleted successfully" });
      } else {
        const row = itemToDelete.item as Row;
        
        // Check if row is assigned to a client
        if (row.companies || row.is_occupied) {
          toast({
            title: "Cannot Delete",
            description: "This row is assigned to a client or occupied. Unassign first.",
            variant: "destructive",
          });
          setDeleteDialogOpen(false);
          return;
        }

        const { error } = await supabase
          .from('warehouse_rows')
          .delete()
          .eq('id', row.id);

        if (error) throw error;
        toast({ title: "Success", description: "Row deleted successfully" });
      }

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  // Filtering
  const filteredZones = zones.filter(zone =>
    zone.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRows = rows.filter(row =>
    row.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.row_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Location Management</h1>
          <p className="text-muted-foreground">
            Manage floor zones and shelf rows
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="zones" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="zones" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Floor Zones
            </TabsTrigger>
            <TabsTrigger value="rows" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Shelf Rows
            </TabsTrigger>
          </TabsList>
          
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Floor Zones Tab */}
        <TabsContent value="zones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Floor Zones</CardTitle>
                <CardDescription>
                  Dedicated floor zones for client storage (A-G)
                </CardDescription>
              </div>
              <Button onClick={() => openZoneDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Floor Zone
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading zones...</div>
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No zones match your search.' : 'No floor zones configured yet.'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Client</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.code}</TableCell>
                        <TableCell>{zone.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: zone.color }}
                            />
                            <span className="text-xs text-muted-foreground">{zone.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={zone.is_active ? "default" : "secondary"}>
                            {zone.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {zone.assigned_company ? (
                            <div>
                              <div className="font-medium text-sm">{zone.assigned_company.name}</div>
                              <div className="text-xs text-muted-foreground">{zone.assigned_company.client_code}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Available</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openZoneDialog(zone)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete('zone', zone)}
                              disabled={!!zone.assigned_company}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* Shelf Rows Tab */}
        <TabsContent value="rows">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Shelf Rows</CardTitle>
                <CardDescription>
                  Individual shelf rows in Zone Z for shared client storage
                </CardDescription>
              </div>
              <Button onClick={() => openRowDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shelf Row
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading rows...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No rows match your search.' : 'No shelf rows configured yet.'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row Number</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Client</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">Row {row.row_number}</TableCell>
                        <TableCell className="font-mono text-sm">{row.code}</TableCell>
                        <TableCell>
                          {row.warehouse_zones ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: row.warehouse_zones.color }}
                              />
                              <span>{row.warehouse_zones.code}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
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
                        <TableCell>
                          {row.companies ? (
                            <div>
                              <div className="font-medium text-sm">{row.companies.name}</div>
                              <div className="text-xs text-muted-foreground">{row.companies.client_code}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Available</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openRowDialog(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete('row', row)}
                              disabled={!!row.companies || row.is_occupied}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Floor Zone' : 'Add Floor Zone'}</DialogTitle>
            <DialogDescription>
              {editingZone ? 'Update the floor zone details.' : 'Create a new floor zone for client storage.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zone-code">Zone Code</Label>
              <Input
                id="zone-code"
                value={zoneForm.code}
                onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                placeholder="A, B, C..."
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">Single letter (A-Z)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                placeholder="Zone A - Storage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="zone-color"
                  value={zoneForm.color}
                  onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={zoneForm.color}
                  onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="zone-active"
                checked={zoneForm.is_active}
                onCheckedChange={(checked) => setZoneForm({ ...zoneForm, is_active: checked as boolean })}
              />
              <Label htmlFor="zone-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveZone}>
              {editingZone ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Row Dialog */}
      <Dialog open={rowDialogOpen} onOpenChange={setRowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? 'Edit Shelf Row' : 'Add Shelf Row'}</DialogTitle>
            <DialogDescription>
              {editingRow ? 'Update the shelf row details.' : 'Create a new shelf row in Zone Z.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="row-number">Row Number</Label>
              <Input
                id="row-number"
                value={rowForm.row_number}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, '').padStart(2, '0');
                  setRowForm({ 
                    ...rowForm, 
                    row_number: num,
                    code: `Z-ROW-${num}`
                  });
                }}
                placeholder="01, 02, 03..."
                maxLength={2}
                disabled={!editingRow}
              />
              <p className="text-xs text-muted-foreground">Auto-generated sequential number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="row-code">Location Code</Label>
              <Input
                id="row-code"
                value={rowForm.code}
                onChange={(e) => setRowForm({ ...rowForm, code: e.target.value })}
                placeholder="Z-ROW-01"
                disabled={!editingRow}
              />
              <p className="text-xs text-muted-foreground">Auto-generated from row number</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="row-active"
                checked={rowForm.is_active}
                onCheckedChange={(checked) => setRowForm({ ...rowForm, is_active: checked as boolean })}
              />
              <Label htmlFor="row-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRowDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRow}>
              {editingRow ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {itemToDelete?.type === 'zone' ? 'floor zone' : 'shelf row'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WarehouseLocations;
