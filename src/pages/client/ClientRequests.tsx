import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, PackageOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckInRequest {
  id: string;
  request_number: string;
  status: string;
  requested_products: any;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

interface CheckOutRequest {
  id: string;
  request_number: string;
  status: string;
  requested_items: any;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export const ClientRequests: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [checkInRequests, setCheckInRequests] = useState<CheckInRequest[]>([]);
  const [checkOutRequests, setCheckOutRequests] = useState<CheckOutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchRequests();
    }
  }, [profile?.company_id]);

  const fetchRequests = async () => {
    if (!profile?.company_id) return;

    try {
      const [checkInData, checkOutData] = await Promise.all([
        supabase
          .from('check_in_requests')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('check_out_requests')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false }),
      ]);

      if (checkInData.error) throw checkInData.error;
      if (checkOutData.error) throw checkOutData.error;

      setCheckInRequests(checkInData.data || []);
      setCheckOutRequests(checkOutData.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
        <p className="text-muted-foreground">View and track your check-in and check-out requests</p>
      </div>

      <Tabs defaultValue="check-in" className="space-y-4">
        <TabsList>
          <TabsTrigger value="check-in">
            <Package className="h-4 w-4 mr-2" />
            Check-In Requests
          </TabsTrigger>
          <TabsTrigger value="check-out">
            <PackageOpen className="h-4 w-4 mr-2" />
            Check-Out Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check-in">
          <Card>
            <CardHeader>
              <CardTitle>Check-In Requests</CardTitle>
              <CardDescription>Requests to add products to your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {checkInRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkInRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.request_number}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {Array.isArray(request.requested_products)
                            ? `${request.requested_products.length} product(s)`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.status === 'rejected' && request.rejection_reason ? (
                            <span className="text-red-600">{request.rejection_reason}</span>
                          ) : (
                            request.notes || '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No check-in requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check-out">
          <Card>
            <CardHeader>
              <CardTitle>Check-Out Requests</CardTitle>
              <CardDescription>Requests to remove products from your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {checkOutRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkOutRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.request_number}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {Array.isArray(request.requested_items)
                            ? `${request.requested_items.length} item(s)`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.status === 'rejected' && request.rejection_reason ? (
                            <span className="text-red-600">{request.rejection_reason}</span>
                          ) : (
                            request.notes || '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No check-out requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};