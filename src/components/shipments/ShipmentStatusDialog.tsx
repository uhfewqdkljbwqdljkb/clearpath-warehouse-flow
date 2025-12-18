import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  company_name: string;
}

interface ShipmentStatusDialogProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (shipmentId: string, newStatus: string, notes?: string) => Promise<void>;
  isLoading: boolean;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'in_transit', label: 'In Transit', color: 'bg-blue-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { value: 'returned', label: 'Returned', color: 'bg-orange-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export const ShipmentStatusDialog: React.FC<ShipmentStatusDialogProps> = ({
  shipment,
  open,
  onOpenChange,
  onUpdateStatus,
  isLoading,
}) => {
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');

  React.useEffect(() => {
    if (shipment) {
      setNewStatus(shipment.status);
      setStatusNotes('');
    }
  }, [shipment]);

  const handleSubmit = async () => {
    if (!shipment || !newStatus) return;
    await onUpdateStatus(shipment.id, newStatus, statusNotes);
    onOpenChange(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'in_transit': return 'secondary';
      case 'returned': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Shipment Status</DialogTitle>
          <DialogDescription>
            Update the status for shipment {shipment.shipment_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{shipment.shipment_number}</p>
              <p className="text-sm text-muted-foreground">{shipment.company_name}</p>
            </div>
            <Badge variant={getStatusBadgeVariant(shipment.status)} className="ml-auto">
              {shipment.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || newStatus === shipment.status}
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
