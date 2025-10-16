import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MultiStepClientFormProps {
  client?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Placeholder component - legacy code disabled due to schema mismatch
export const MultiStepClientForm: React.FC<MultiStepClientFormProps> = ({ onCancel }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Step Client Form</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          This feature is currently being updated to match the new database schema.
        </p>
        <Button onClick={onCancel}>Back</Button>
      </CardContent>
    </Card>
  );
};
