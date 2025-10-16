import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder component - legacy code disabled due to schema mismatch
export const ClientProducts: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Products feature is currently being updated to match the new database schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
