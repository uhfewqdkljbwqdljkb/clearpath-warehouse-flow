import React from 'react';
import { Bell, Settings, User, LogOut, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const ClientHeader: React.FC = () => {
  const { signOut, profile, company } = useAuth();

  return (
    <header className="bg-white text-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <Building className="h-5 w-5 text-gray-600" />
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            {company?.name || 'Client Portal'}
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back, {profile?.full_name}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
          <Bell className="h-4 w-4 mr-2" />
          Alerts
        </Button>
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};