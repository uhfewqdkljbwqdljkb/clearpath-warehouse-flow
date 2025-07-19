import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ClipboardList, 
  TruckIcon, 
  Send, 
  BarChart3, 
  Settings, 
  LogOut,
  Warehouse,
  History,
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, logout } = useAuth();

  const adminNavItems = [
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: ClipboardList, label: 'Orders', path: '/orders' },
    { icon: TruckIcon, label: 'Receiving', path: '/receiving' },
    { icon: Send, label: 'Shipping', path: '/shipping' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const clientNavItems = [
    { icon: ClipboardList, label: 'My Orders', path: '/my-orders' },
    { icon: Package, label: 'Inventory Levels', path: '/inventory-levels' },
    { icon: History, label: 'Order History', path: '/order-history' },
    { icon: MessageCircle, label: 'Contact', path: '/contact' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : clientNavItems;

  return (
    <div className={`bg-card border-r border-border transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <Warehouse className="h-8 w-8 text-primary" />
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-foreground">Clearpath</h1>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'Warehouse Management' : 'Client Portal'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};