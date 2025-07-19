
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BarChart3,
  Package, 
  ClipboardList, 
  TruckIcon, 
  Send, 
  Users, 
  Settings, 
  LogOut,
  Download
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, logout } = useAuth();

  const adminNavItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: ClipboardList, label: 'Orders', path: '/orders' },
    { icon: Download, label: 'Receiving', path: '/receiving' },
    { icon: Send, label: 'Shipping', path: '/shipping' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const clientNavItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/' },
    { icon: ClipboardList, label: 'My Orders', path: '/my-orders' },
    { icon: Package, label: 'Inventory Levels', path: '/inventory-levels' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : clientNavItems;

  return (
    <div className={`bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/10 hover:text-[hsl(var(--sidebar-accent))]'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
        {!isCollapsed && (
          <div className="mb-4">
            <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))]">{user?.name}</p>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/70">{user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={logout}
          className="w-full justify-start text-[hsl(var(--sidebar-foreground))]/70 hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/10"
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};
