import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Placeholder component - legacy code disabled due to schema mismatch
export const ClientProfile: React.FC = () => {
  const { profile, company } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p>{profile?.full_name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p>{profile?.email}</p>
          </div>
          {company && (
            <div>
              <label className="text-sm font-medium">Company</label>
              <p>{company.name}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
