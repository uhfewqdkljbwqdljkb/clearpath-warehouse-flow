import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder component - legacy code disabled due to schema mismatch
export const EnhancedClientManagement: React.FC<{ companyId: string }> = ({ companyId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This feature is currently unavailable. Please use the Clients page.
        </p>
      </CardContent>
    </Card>
  );
};
