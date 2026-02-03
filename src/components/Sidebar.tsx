import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Warehouse, MessageSquare, User, Package, Settings, Menu, Sparkles, PackageCheck, PackageOpen, Truck, ClipboardCheck, Database, MapPin } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle
}) => {
  const { profile } = useAuth();
  
  // Role-based permissions for pages
  const pagePermissions: Record<string, string[]> = {
    '/dashboard': ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'],
    '/dashboard/warehouse': ['admin', 'super_admin', 'warehouse_manager'],
    '/dashboard/warehouse/locations': ['admin', 'super_admin'],
    '/dashboard/messages': ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'],
    '/dashboard/clients': ['admin', 'super_admin'],
    '/dashboard/products': ['admin', 'super_admin', 'warehouse_manager'],
    '/dashboard/check-in-requests': ['admin', 'super_admin', 'warehouse_manager'],
    '/dashboard/check-out-requests': ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'],
    '/dashboard/ship-products': ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'],
    '/dashboard/jarde': ['admin', 'super_admin', 'warehouse_manager'],
    '/dashboard/data-cleanup': ['admin', 'super_admin'],
    '/dashboard/ai-assistant': ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'],
    '/dashboard/users': ['super_admin'], // Only super_admin can access
  };

  const allNavItems = [{
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  }, {
    name: 'Warehouse',
    path: '/dashboard/warehouse',
    icon: Warehouse
  }, {
    name: 'Location Mgmt',
    path: '/dashboard/warehouse/locations',
    icon: MapPin
  }, {
    name: 'Messages',
    path: '/dashboard/messages',
    icon: MessageSquare
  }, {
    name: 'Clients',
    path: '/dashboard/clients',
    icon: User
  }, {
    name: 'Products',
    path: '/dashboard/products',
    icon: Package
  }, {
    name: 'Check-In Requests',
    path: '/dashboard/check-in-requests',
    icon: PackageCheck
  }, {
    name: 'Check-Out Requests',
    path: '/dashboard/check-out-requests',
    icon: PackageOpen
  }, {
    name: 'Ship Products',
    path: '/dashboard/ship-products',
    icon: Truck
  }, {
    name: 'JARDE',
    path: '/dashboard/jarde',
    icon: ClipboardCheck
  }, {
    name: 'Data Cleanup',
    path: '/dashboard/data-cleanup',
    icon: Database
  }, {
    name: 'AI Assistant',
    path: '/dashboard/ai-assistant',
    icon: Sparkles
  }, {
    name: 'Users',
    path: '/dashboard/users',
    icon: Settings
  }];

  // Filter nav items based on user role
  const navItems = useMemo(() => {
    if (!profile?.role) return [];
    
    return allNavItems.filter(item => {
      const allowedRoles = pagePermissions[item.path];
      return allowedRoles?.includes(profile.role);
    });
  }, [profile?.role]);
  
  return (
    <div className={`bg-white h-screen flex flex-col border-r border-gray-200 ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Clearpath</h1>
              </div>
            )}
          </div>
          <button onClick={onToggle} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <Menu className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 pt-4">
        <ul className="space-y-1 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink 
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 text-xs font-medium rounded-[8px] transition-colors ${
                      isActive 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                >
                  <Icon className={`${isCollapsed ? 'mx-auto' : 'mr-2'} h-4 w-4 flex-shrink-0`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Account Section */}
      <div className="border-t border-gray-200 p-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.email || 'user@example.com'}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button className="p-1 rounded-md hover:bg-gray-100">
              <Settings className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};