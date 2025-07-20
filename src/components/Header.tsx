
import React from 'react';
import { Bell, Settings, User, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between border-b">
      {/* Left Side - Logo and Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Warehouse className="h-6 w-6" />
          <span className="text-xl font-bold">CLEARPATH</span>
        </div>
        <div className="text-sm opacity-75">
          <span>Warehouse Dashboard</span>
        </div>
      </div>

      {/* Right Side - Action Buttons */}
      <div className="flex items-center space-x-3">
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <Bell className="h-4 w-4 mr-2" />
          Receive
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <Settings className="h-4 w-4 mr-2" />
          Ship
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <User className="h-4 w-4 mr-2" />
          Track
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          Reports
        </Button>
        <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
