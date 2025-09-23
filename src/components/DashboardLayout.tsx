import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AdminClientPortalBridge } from './AdminClientPortalBridge';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  return <div className="h-screen flex bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Toggle button */}
        

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6" style={{
        backgroundColor: '#F0F0F0'
      }}>
          <AdminClientPortalBridge />
          <Outlet />
        </main>
      </div>
    </div>;
};