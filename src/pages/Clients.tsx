import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, MoreHorizontal, Building2, Users, DollarSign, Package, Eye } from 'lucide-react';
import { Client } from '@/types';
import { MultiStepClientForm } from '@/components/MultiStepClientForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientMetrics, setClientMetrics] = useState<Record<string, { productCount: number; inventoryValue: number }>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
    fetchClientMetrics();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          warehouse_zones:assigned_floor_zone_id(code, name, color),
          warehouse_rows:assigned_row_id(code)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive",
        });
        return;
      }

      // Map companies data to Client interface
      const clientsData: Client[] = companies?.map(company => ({
        id: company.id,
        client_code: company.client_code || '',
        company_name: company.name,
        contact_name: company.contact_email || '',
        email: company.contact_email || '',
        phone: company.contact_phone || '',
        address: company.address || '',
        billing_address: company.address || '', // Using address as billing_address since that column doesn't exist
        contract_start_date: new Date().toISOString(), // Default values since these columns don't exist
        contract_end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        storage_plan: 'basic', // Default since column doesn't exist
        max_storage_cubic_feet: 0, // Default since column doesn't exist
        monthly_fee: 0, // Default since column doesn't exist
        is_active: company.is_active ?? true,
        location_type: undefined,
        assigned_floor_zone_id: undefined,
        assigned_row_id: undefined,
        created_at: company.created_at,
        updated_at: company.updated_at,
      })) || [];

      setClients(clientsData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientMetrics = async () => {
    try {
      // Get product counts for each client
      const { data: productData, error: productError } = await supabase
        .from('client_products')
        .select(`
          company_id,
          inventory_items(quantity)
        `)
        .eq('is_active', true);

      if (productError) {
        console.error('Error fetching product metrics:', productError);
        return;
      }

      const metrics: Record<string, { productCount: number; inventoryValue: number }> = {};
      
      productData?.forEach(product => {
        const companyId = product.company_id;
        if (!metrics[companyId]) {
          metrics[companyId] = { productCount: 0, inventoryValue: 0 };
        }
        
        metrics[companyId].productCount += 1;
        
        // Inventory value calculation removed since unit_value field was removed
        metrics[companyId].inventoryValue = 0;
      });

      setClientMetrics(metrics);
    } catch (error) {
      console.error('Error fetching client metrics:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to convert empty strings to null for dates
  const toDateOrNull = (dateStr: string | undefined) => {
    return dateStr && dateStr.trim() !== '' ? dateStr : null;
  };

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { initial_products?: Array<{name: string, variants?: any[], quantity?: number}> }) => {
    try {
      // Generate client code if not provided
      let client_code = clientData.client_code;
      if (!client_code) {
        const { data: generatedCode, error: codeError } = await supabase
          .rpc('generate_client_code');
        
        if (codeError) {
          throw codeError;
        }
        client_code = generatedCode;
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({
          client_code,
          name: clientData.company_name,
          contact_email: clientData.email,
          contact_phone: clientData.phone,
          address: clientData.address,
          is_active: clientData.is_active,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add client",
          variant: "destructive",
        });
        return;
      }

      // Remove row occupancy logic since these columns don't exist
      // Just insert the company without the occupancy tracking

      // Save initial products if provided
      if (clientData.initial_products && clientData.initial_products.length > 0) {
        const productsToInsert = clientData.initial_products.map(product => ({
          company_id: data.id,
          sku: `${client_code}-${product.name.substring(0, 10).toUpperCase().replace(/\s/g, '')}`,
          name: product.name,
          variants: product.variants || [],
          quantity: product.quantity || 0,
          is_active: true,
        }));

        const { error: productsError } = await supabase
          .from('client_products')
          .insert(productsToInsert);

        if (productsError) {
          console.error('Error adding initial products:', productsError);
          toast({
            title: "Warning",
            description: "Client added but some products could not be saved",
            variant: "destructive",
          });
        }
      }

      await fetchClients();
      await fetchClientMetrics();
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingClient) return;

    try {
      // Get old assignment to update occupancy if changing
      const { data: oldData } = await supabase
        .from('companies')
        .select('assigned_row_id, location_type')
        .eq('id', editingClient.id)
        .single();

      const { error } = await supabase
        .from('companies')
        .update({
          client_code: clientData.client_code,
          name: clientData.company_name,
          contact_email: clientData.email,
          contact_phone: clientData.phone,
          address: clientData.address,
          is_active: clientData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.id);

      if (error) {
        console.error('Error updating client:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update client",
          variant: "destructive",
        });
        return;
      }

      // Remove row occupancy logic since location_type and related columns don't exist in companies table

      await fetchClients();
      await fetchClientMetrics();
      setEditingClient(null);
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update client",
        variant: "destructive",
      });
    }
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingClient(null);
  };

  const handleViewProducts = (client: Client) => {
    navigate(`/dashboard/clients/${client.id}/products`);
  };

  const activeClients = clients.filter(c => c.is_active);
  const totalStorage = clients.reduce((sum, c) => sum + c.max_storage_cubic_feet, 0);

  const getStoragePlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // If showing add/edit form, render the multi-step form
  if (showAddForm) {
    return (
      <MultiStepClientForm
        client={editingClient}
        onSubmit={editingClient ? handleEditClient : handleAddClient}
        onCancel={closeForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage warehouse clients and their storage contracts
          </p>
        </div>
        <Button onClick={() => { setEditingClient(null); setShowAddForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.length - activeClients.length} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStorage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">cubic feet allocated</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>
            All client accounts and their contract details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading clients...</div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                {searchTerm ? 'No clients found matching your search.' : 'No clients found. Add your first client to get started.'}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const metrics = clientMetrics[client.id] || { productCount: 0, inventoryValue: 0 };
                  return (
                  <TableRow key={client.id} className="animate-fade-in">
                    <TableCell className="font-medium">{client.client_code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.company_name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.contact_name}</div>
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStoragePlanColor(client.storage_plan)}>
                        {client.storage_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.max_storage_cubic_feet.toLocaleString()} ft³
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{metrics.productCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProducts(client)}
                          title="View Products"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(client)}
                          title="Edit Client"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};