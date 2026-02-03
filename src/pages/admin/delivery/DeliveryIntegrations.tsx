import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plug, 
  ShoppingBag, 
  Check,
  X,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useShopifyIntegrations, useIntegrationRequests } from '@/hooks/useIntegrations';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  setup_complete: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  disconnected: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
};

export default function DeliveryIntegrations() {
  const { integrations, loading: integrationsLoading, updateIntegrationStatus, disconnectIntegration } = useShopifyIntegrations();
  const { requests, loading: requestsLoading, approveRequest, rejectRequest } = useIntegrationRequests();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_review');

  const handleApprove = async () => {
    if (selectedRequest) {
      await approveRequest(selectedRequest.id, adminNotes);
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };

  const handleReject = async () => {
    if (selectedRequest && rejectionReason) {
      await rejectRequest(selectedRequest.id, rejectionReason);
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground">Manage Shopify and other e-commerce integrations</p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="destructive" className="px-3 py-1">
            {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Integrations</TabsTrigger>
          <TabsTrigger value="requests">
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Integrations */}
        <TabsContent value="active" className="mt-6">
          {integrationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Active Integrations</p>
                <p className="text-muted-foreground">
                  Client integration requests will appear here once approved
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onPause={() => updateIntegrationStatus(integration.id, 'paused')}
                  onResume={() => updateIntegrationStatus(integration.id, 'active')}
                  onDisconnect={() => disconnectIntegration(integration.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Integration Type</TableHead>
                    <TableHead>Shop URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No integration requests</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {request.company?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            {request.integration_type}
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.shop_url ? (
                            <a 
                              href={request.shop_url.startsWith('http') ? request.shop_url : `https://${request.shop_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {request.shop_url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            {request.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' || request.status === 'in_review' ? (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Integration Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this integration request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">{selectedRequest.company?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Integration Type</Label>
                  <p className="font-medium">{selectedRequest.integration_type}</p>
                </div>
              </div>
              
              {selectedRequest.shop_url && (
                <div>
                  <Label className="text-muted-foreground">Shop URL</Label>
                  <p className="font-medium">{selectedRequest.shop_url}</p>
                </div>
              )}
              
              {selectedRequest.request_notes && (
                <div>
                  <Label className="text-muted-foreground">Client Notes</Label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedRequest.request_notes}</p>
                </div>
              )}

              {selectedRequest.technical_contact_email && (
                <div>
                  <Label className="text-muted-foreground">Technical Contact</Label>
                  <p className="text-sm">
                    {selectedRequest.technical_contact_email}
                    {selectedRequest.technical_contact_phone && ` • ${selectedRequest.technical_contact_phone}`}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes (optional)</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this integration..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="destructive" 
              onClick={() => {
                setReviewDialogOpen(false);
                setRejectDialogOpen(true);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button onClick={handleApprove}>
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="rejection_reason">Rejection Reason *</Label>
            <Textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this request is being rejected..."
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface IntegrationCardProps {
  integration: any;
  onPause: () => void;
  onResume: () => void;
  onDisconnect: () => void;
}

function IntegrationCard({ integration, onPause, onResume, onDisconnect }: IntegrationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{integration.shop_name || integration.shop_domain}</CardTitle>
              <p className="text-sm text-muted-foreground">{integration.shop_domain}</p>
            </div>
          </div>
          <Badge className={statusColors[integration.status]}>
            {integration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Client: </span>
          <span className="font-medium">{integration.company?.name}</span>
        </div>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Last Sync: </span>
          <span>
            {integration.last_order_sync_at 
              ? format(new Date(integration.last_order_sync_at), 'MMM d, HH:mm')
              : 'Never'}
          </span>
        </div>

        {integration.last_error && (
          <div className="flex items-start gap-2 p-2 rounded bg-red-50 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{integration.last_error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {integration.status === 'active' ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={onPause}>
              Pause
            </Button>
          ) : integration.status === 'paused' ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={onResume}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Resume
            </Button>
          ) : null}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-red-600 hover:text-red-700"
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
