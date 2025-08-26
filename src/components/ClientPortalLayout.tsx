import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ClientHeader } from './ClientHeader';

export const ClientPortalLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader />
        
        <main className="flex-1 overflow-auto p-6" style={{
          backgroundColor: '#F0F0F0'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};