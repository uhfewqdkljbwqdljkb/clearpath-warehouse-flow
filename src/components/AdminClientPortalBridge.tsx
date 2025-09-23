import React from 'react';
import { useIntegration } from '@/contexts/IntegrationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowLeft,
  Clock,
  User
} from 'lucide-react';

export const AdminClientPortalBridge: React.FC = () => {
  const { 
    isViewingAsClient, 
    adminUser, 
    clientCompany, 
    stopViewingAsClient 
  } = useIntegration();

  if (!isViewingAsClient || !adminUser || !clientCompany) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">
              Admin View Active
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <User className="h-3 w-3" />
            <span>Admin: {adminUser.full_name || adminUser.email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Clock className="h-3 w-3" />
            <span>Viewing: {clientCompany.name}</span>
          </div>
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {clientCompany.client_code}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={stopViewingAsClient}
          className="text-blue-700 border-blue-300 hover:bg-blue-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Admin
        </Button>
      </AlertDescription>
    </Alert>
  );
};