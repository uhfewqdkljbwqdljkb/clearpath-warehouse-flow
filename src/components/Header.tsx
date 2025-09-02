
import React from 'react';
import { Bell, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const Header: React.FC = () => {
  const { signOut, profile } = useAuth();

  return (
    <header className="bg-white text-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-200">
      {/* Left Side - Page Title */}
      <div className="flex items-center">
        <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
      </div>

      {/* Right Side - Action Buttons */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
          <Bell className="h-4 w-4 mr-2" />
          Send Email
        </Button>
        <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
          <Settings className="h-4 w-4 mr-2" />
          Dashboard
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
