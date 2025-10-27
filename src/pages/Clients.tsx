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
import { Search, Plus, MoreHorizontal, Building2, Users, DollarSign, Package, Eye, Pencil, Trash2, Key, FileText, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Client } from '@/types';
import { MultiStepClientForm } from '@/components/MultiStepClientForm';
import { ClientCredentialsDialog } from '@/components/ClientCredentialsDialog';
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
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [credentialsClient, setCredentialsClient] = useState<Client | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
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
          warehouse_zones:assigned_floor_zone_id(id, code, name, color),
          warehouse_rows:assigned_row_id(id, code, row_number)
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
        billing_address: company.billing_address || company.address || '',
        contract_start_date: company.contract_start_date || new Date().toISOString(),
        contract_end_date: company.contract_end_date || new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        storage_plan: 'basic',
        max_storage_cubic_feet: 0,
        monthly_fee: 0,
        is_active: company.is_active ?? true,
        location_type: company.location_type,
        assigned_floor_zone_id: company.assigned_floor_zone_id,
        assigned_row_id: company.assigned_row_id,
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
      // Fetch product counts for each client
      const { data: productData, error: productError } = await supabase
        .from('client_products')
        .select('company_id')
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
        metrics[companyId].inventoryValue = 0; // Value calculation removed
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

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { 
    contract_document_url?: string;
    create_portal_access?: boolean;
    client_user_email?: string;
    client_user_password?: string;
  }) => {
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

      const insertData = {
        client_code,
        name: clientData.company_name,
        contact_email: clientData.email,
        contact_phone: clientData.phone,
        address: clientData.address,
        billing_address: clientData.billing_address || clientData.address,
        contract_start_date: clientData.contract_start_date || null,
        contract_end_date: clientData.contract_end_date || null,
        contract_document_url: clientData.contract_document_url || null,
        is_active: clientData.is_active,
        location_type: clientData.location_type || null,
        assigned_floor_zone_id: clientData.assigned_floor_zone_id || null,
        assigned_row_id: clientData.assigned_row_id || null,
      };

      const { data, error } = await supabase
        .from('companies')
        .insert(insertData)
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

      // Create allocation record if location is assigned
      if (data && (clientData.assigned_floor_zone_id || clientData.assigned_row_id)) {
        const { error: allocError } = await supabase
          .from('client_allocations')
          .insert({
            company_id: data.id,
            location_type: clientData.location_type,
            assigned_floor_zone_id: clientData.assigned_floor_zone_id || null,
            assigned_row_id: clientData.assigned_row_id || null,
          });

        if (allocError) {
          console.error('Error creating allocation:', allocError);
          toast({
            title: "Warning",
            description: "Client created but allocation record failed.",
            variant: "destructive",
          });
        }
      }

      // Create portal user if requested
      if (data && clientData.create_portal_access && clientData.client_user_email && clientData.client_user_password) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          const { data: userData, error: authError } = await supabase.functions.invoke('create-client-user', {
            body: {
              email: clientData.client_user_email,
              password: clientData.client_user_password,
              company_name: clientData.company_name,
              company_id: data.id
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`
            }
          });

          if (authError) {
            console.error('Error creating user:', authError);
            toast({
              title: "Warning",
              description: "Client created but portal user creation failed: " + authError.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: `Client and portal access created successfully. Login: ${clientData.client_user_email}`,
            });
          }
        } catch (error: any) {
          console.error('Error in user creation:', error);
          toast({
            title: "Warning",
            description: "Client created but portal setup encountered an error.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Client added successfully",
        });
      }
      
      await fetchClients();
      await fetchClientMetrics();
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> & {
    contract_document_url?: string;
    create_portal_access?: boolean;
    client_user_email?: string;
    client_user_password?: string;
  }) => {
    if (!editingClient) return;

    try {
      console.log('Updating company with data:', clientData);
      const updatePayload = {
        client_code: clientData.client_code,
        name: clientData.company_name,
        contact_email: clientData.email,
        contact_phone: clientData.phone,
        address: clientData.address,
        billing_address: clientData.billing_address || clientData.address,
        contract_start_date: clientData.contract_start_date || null,
        contract_end_date: clientData.contract_end_date || null,
        contract_document_url: clientData.contract_document_url || null,
        is_active: clientData.is_active,
        location_type: clientData.location_type || null,
        assigned_floor_zone_id: clientData.assigned_floor_zone_id || null,
        assigned_row_id: clientData.assigned_row_id || null,
        updated_at: new Date().toISOString(),
      };
      console.log('Supabase update payload:', updatePayload);

      const { error } = await supabase
        .from('companies')
        .update(updatePayload)
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

      // Sync allocation record
      if (clientData.assigned_floor_zone_id || clientData.assigned_row_id) {
        // Check if allocation exists
        const { data: existingAlloc } = await supabase
          .from('client_allocations')
          .select('id')
          .eq('company_id', editingClient.id)
          .maybeSingle();

        if (existingAlloc) {
          // Update existing allocation
          const { error: allocError } = await supabase
            .from('client_allocations')
            .update({
              location_type: clientData.location_type,
              assigned_floor_zone_id: clientData.assigned_floor_zone_id || null,
              assigned_row_id: clientData.assigned_row_id || null,
            })
            .eq('id', existingAlloc.id);

          if (allocError) {
            console.error('Error updating allocation:', allocError);
          }
        } else {
          // Create new allocation
          const { error: allocError } = await supabase
            .from('client_allocations')
            .insert({
              company_id: editingClient.id,
              location_type: clientData.location_type,
              assigned_floor_zone_id: clientData.assigned_floor_zone_id || null,
              assigned_row_id: clientData.assigned_row_id || null,
            });

          if (allocError) {
            console.error('Error creating allocation:', allocError);
          }
        }
      } else {
        // Remove allocation if no location assigned
        await supabase
          .from('client_allocations')
          .delete()
          .eq('company_id', editingClient.id);
      }

      // Create portal user on edit if requested
      if (clientData.create_portal_access && clientData.client_user_email && clientData.client_user_password) {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const { data: userData, error: authError } = await supabase.functions.invoke('create-client-user', {
            body: {
              email: clientData.client_user_email,
              password: clientData.client_user_password,
              company_name: clientData.company_name,
              company_id: editingClient.id,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (authError) {
            console.error('Error creating user:', authError);
            toast({
              title: 'Warning',
              description:
                'Client updated but portal user creation failed: ' + authError.message,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Success',
              description: `Client updated and portal access created. Login: ${clientData.client_user_email}`,
            });
          }
        } catch (error: any) {
          console.error('Error in user creation:', error);
          toast({
            title: 'Warning',
            description: 'Client updated but portal setup encountered an error.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: 'Client updated successfully',
        });
      }

      await fetchClients();
      await fetchClientMetrics();
      setEditingClient(null);
      setShowAddForm(false);
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

  const handleManageCredentials = (client: Client) => {
    setCredentialsClient(client);
    setShowCredentialsDialog(true);
  };

  const handleViewContract = (client: Client) => {
    const contractUrl = (client as any).contract_document_url;
    if (contractUrl) {
      window.open(contractUrl, '_blank');
    } else {
      toast({
        title: "No Contract",
        description: "This client doesn't have a contract document uploaded.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', deletingClient.id);

      if (error) {
        console.error('Error deleting client:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete client",
          variant: "destructive",
        });
        return;
      }

      await fetchClients();
      await fetchClientMetrics();
      setDeletingClient(null);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const activeClients = clients.filter(c => c.is_active);

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(client)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageCredentials(client)}>
                              <Key className="h-4 w-4 mr-2" />
                              Manage Portal Access
                            </DropdownMenuItem>
                            {(client as any).contract_document_url && (
                              <DropdownMenuItem onClick={() => handleViewContract(client)}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Contract
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingClient(client)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.company_name}? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClientCredentialsDialog
        client={credentialsClient}
        open={showCredentialsDialog}
        onOpenChange={setShowCredentialsDialog}
      />
    </div>
  );
};