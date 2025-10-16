import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// This component is now replaced by the main Messages page
// Kept for backward compatibility
export const UnifiedMessaging: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Please use the main Messages page from the navigation menu.
        </p>
      </CardContent>
    </Card>
  );
};