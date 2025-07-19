import React, { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, MoreHorizontal, Building2, Users, DollarSign } from 'lucide-react';
import { mockClients } from '@/data/mockData';
import { Client } from '@/types';
import { ClientForm } from '@/components/ClientForm';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setClients([...clients, newClient]);
    setIsDialogOpen(false);
  };

  const handleEditClient = (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingClient) {
      const updatedClient: Client = {
        ...clientData,
        id: editingClient.id,
        created_at: editingClient.created_at,
        updated_at: new Date().toISOString(),
      };
      setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));
      setEditingClient(null);
      setIsDialogOpen(false);
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
  };

  const activeClients = clients.filter(c => c.is_active);
  const totalStorage = clients.reduce((sum, c) => sum + c.max_storage_cubic_feet, 0);
  const totalRevenue = activeClients.reduce((sum, c) => sum + c.monthly_fee, 0);

  const getStoragePlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingClient(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? 'Update client information and storage contract details.'
                  : 'Enter client information and storage contract details.'
                }
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              client={editingClient}
              onSubmit={editingClient ? handleEditClient : handleAddClient}
              onCancel={closeDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from active contracts</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Code</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
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
                  <TableCell>${client.monthly_fee.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(client)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};