
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
    <header className="bg-[hsl(var(--header-background))] text-[hsl(var(--header-foreground))] px-6 py-4 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
      {/* Left Side - Logo */}
      <div className="flex items-center space-x-3">
        <Warehouse className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-xl font-bold">Clearpath</h1>
          <p className="text-xs text-gray-300">Warehouse Management</p>
        </div>
      </div>

      {/* Center - Page Title */}
      <div className="text-xl font-semibold">
        Dashboard
      </div>

      {/* Right Side - User Section */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-300">
          {currentDate}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Admin</div>
            <div className="text-xs text-gray-300">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
};
