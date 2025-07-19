import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  mockClients, 
  warehouseZones, 
  checkAllocationConflict,
  getAvailableZones 
} from '@/data/mockData';
import { ClientAllocation } from '@/types';

const allocationSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  allocation_type: z.enum(['zone', 'row_range', 'specific_bins']),
  zone_id: z.string().min(1, 'Zone is required'),
  start_row_id: z.string().optional(),
  end_row_id: z.string().optional(),
  specific_bin_ids: z.array(z.string()).optional(),
  allocated_cubic_feet: z.number().min(1, 'Allocated space must be greater than 0'),
  allocation_date: z.string().min(1, 'Allocation date is required'),
  is_active: z.boolean(),
});

type AllocationFormData = z.infer<typeof allocationSchema>;

interface AllocationFormProps {
  allocation?: ClientAllocation | null;
  onSubmit: (data: Omit<ClientAllocation, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const AllocationForm: React.FC<AllocationFormProps> = ({ allocation, onSubmit, onCancel }) => {
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: allocation ? {
      client_id: allocation.client_id,
      allocation_type: allocation.allocation_type,
      zone_id: allocation.zone_id || '',
      start_row_id: allocation.start_row_id || '',
      end_row_id: allocation.end_row_id || '',
      specific_bin_ids: allocation.specific_bin_ids || [],
      allocated_cubic_feet: allocation.allocated_cubic_feet,
      allocation_date: allocation.allocation_date,
      is_active: allocation.is_active,
    } : {
      client_id: '',
      allocation_type: 'zone',
      zone_id: '',
      start_row_id: '',
      end_row_id: '',
      specific_bin_ids: [],
      allocated_cubic_feet: 0,
      allocation_date: new Date().toISOString().split('T')[0],
      is_active: true,
    },
  });

  const watchedValues = form.watch(['allocation_type', 'zone_id', 'start_row_id', 'end_row_id']);

  const handleSubmit = (data: AllocationFormData) => {
    // Check for allocation conflicts
    const hasConflict = checkAllocationConflict(
      data.zone_id,
      data.allocation_type,
      data.start_row_id,
      data.end_row_id,
      data.specific_bin_ids
    );

    if (hasConflict && !allocation) {
      setConflictError('This allocation conflicts with existing allocations in the same zone.');
      setSuccessMessage(null);
      return;
    }

    setConflictError(null);
    setSuccessMessage('Allocation validated successfully!');
    
    setTimeout(() => {
      onSubmit(data as Omit<ClientAllocation, 'id' | 'created_at' | 'updated_at'>);
    }, 1000);
  };

  const selectedZone = warehouseZones.find(z => z.id === watchedValues[1]);
  const allocationType = watchedValues[0];

  const generateRowOptions = (zoneId: string) => {
    const zone = warehouseZones.find(z => z.id === zoneId);
    if (!zone) return [];
    
    const rows = [];
    for (let i = 1; i <= zone.total_rows; i++) {
      const rowId = `${zoneId}${String(i).padStart(2, '0')}`;
      rows.push(rowId);
    }
    return rows;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {conflictError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{conflictError}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockClients.filter(c => c.is_active).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name} ({client.client_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allocation_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select allocation type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="zone">Entire Zone</SelectItem>
                    <SelectItem value="row_range">Row Range</SelectItem>
                    <SelectItem value="specific_bins">Specific Bins</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {allocationType === 'zone' && 'Allocate the entire zone to the client'}
                  {allocationType === 'row_range' && 'Allocate a range of rows within a zone'}
                  {allocationType === 'specific_bins' && 'Allocate specific bins within a zone'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zone_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouseZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name} ({zone.total_cubic_feet.toLocaleString()} ft³)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allocation_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row Range Fields */}
        {allocationType === 'row_range' && selectedZone && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_row_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Row</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start row" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {generateRowOptions(selectedZone.id).map((rowId) => (
                        <SelectItem key={rowId} value={rowId}>
                          Row {rowId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_row_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Row</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end row" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {generateRowOptions(selectedZone.id).map((rowId) => (
                        <SelectItem key={rowId} value={rowId}>
                          Row {rowId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="allocated_cubic_feet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocated Space (ft³)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="5000" 
                />
              </FormControl>
              <FormDescription>
                {selectedZone && `Zone capacity: ${selectedZone.total_cubic_feet.toLocaleString()} ft³`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Allocation</FormLabel>
                <FormDescription>
                  Enable or disable this allocation
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!!conflictError}>
            {allocation ? 'Update Allocation' : 'Create Allocation'}
          </Button>
        </div>
      </form>
    </Form>
  );
};