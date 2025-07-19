
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Toggle button */}
        <div className="px-6 py-2 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#F0F0F0' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
