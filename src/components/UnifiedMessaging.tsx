import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder component - legacy code disabled due to schema mismatch
export const UnifiedMessaging: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Messaging feature is currently unavailable.
        </p>
      </CardContent>
    </Card>
  );
};
