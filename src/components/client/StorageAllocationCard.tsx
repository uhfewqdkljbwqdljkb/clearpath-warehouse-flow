import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, MapPin } from 'lucide-react';

interface StorageAllocationProps {
  companyId: string;
  locationType: 'floor_zone' | 'shelf_row';
}

export const StorageAllocationCard: React.FC<StorageAllocationProps> = ({
  companyId,
  locationType,
}) => {
  const { company, profile } = useAuth();
  const [allocation, setAllocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllocation();
  }, [companyId, company]);

  const fetchAllocation = async () => {
    try {
      // Use company from auth context if it matches, otherwise fetch warehouse zone/row details
      if (company && company.id === companyId) {
        // Fetch just the warehouse zone/row details
        let warehouseData: any = { ...company };
        
        if (company.assigned_floor_zone_id) {
          const { data: zone } = await supabase
            .from('warehouse_zones')
            .select('id, code, name, color')
            .eq('id', company.assigned_floor_zone_id)
            .single();
          warehouseData.warehouse_zones = zone;
        }
        
        if (company.assigned_row_id) {
          const { data: row } = await supabase
            .from('warehouse_rows')
            .select('id, code, row_number')
            .eq('id', company.assigned_row_id)
            .single();
          warehouseData.warehouse_rows = row;
        }
        
        setAllocation(warehouseData);
      }
    } catch (error) {
      console.error('Error fetching allocation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !allocation) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Storage Allocation
        </CardTitle>
        <CardDescription>Your assigned warehouse space</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Location Type</p>
            <Badge variant="secondary">
              {locationType === 'floor_zone' ? 'Floor Zone' : 'Shelf Row'}
            </Badge>
          </div>
        </div>

        {locationType === 'floor_zone' && allocation.warehouse_zones && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Assigned Zone</p>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: allocation.warehouse_zones.color }}
              />
              <span className="text-sm">
                {allocation.warehouse_zones.name} ({allocation.warehouse_zones.code})
              </span>
            </div>
          </div>
        )}

        {locationType === 'shelf_row' && allocation.warehouse_rows && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Assigned Row</p>
            <span className="text-sm">
              {allocation.warehouse_rows.row_number} ({allocation.warehouse_rows.code})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
