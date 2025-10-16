import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder component - legacy code disabled due to schema mismatch
export const ClientDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Client Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dashboard feature is currently being updated to match the new database schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
