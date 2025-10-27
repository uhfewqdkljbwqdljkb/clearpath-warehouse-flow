import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin } from 'lucide-react';

interface StorageAllocationProps {
  companyId: string;
  locationType: 'floor_zone' | 'shelf_row';
}

export const StorageAllocationCard: React.FC<StorageAllocationProps> = ({
  companyId,
  locationType,
}) => {
  const [allocation, setAllocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllocation();
  }, [companyId]);

  const fetchAllocation = async () => {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select(`
          *,
          warehouse_zones:assigned_floor_zone_id(id, code, name, color),
          warehouse_rows:assigned_row_id(id, code, row_number)
        `)
        .eq('id', companyId)
        .single();

      setAllocation(company);
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
