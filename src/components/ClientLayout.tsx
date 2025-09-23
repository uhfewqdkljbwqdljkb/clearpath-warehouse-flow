import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ClientSidebar } from './ClientSidebar';
import { ClientHeader } from './ClientHeader';
import { AdminClientPortalBridge } from './AdminClientPortalBridge';

export const ClientLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background">
      <ClientSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader />
        
        <main className="flex-1 overflow-auto p-6 bg-muted/50">
          <AdminClientPortalBridge />
          <Outlet />
        </main>
      </div>
    </div>
  );
};