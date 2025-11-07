import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  ClipboardList,
  BarChart3,
  MessageSquare,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ClientSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ isCollapsed, onToggle }) => {
  const { profile, company } = useAuth();
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/client',
      icon: LayoutDashboard
    },
    {
      name: 'Products',
      path: '/client/products',
      icon: Package
    },
    {
      name: 'Requests',
      path: '/client/requests',
      icon: ClipboardList
    },
    {
      name: 'Orders',
      path: '/client/orders',
      icon: Warehouse
    },
    {
      name: 'Analytics',
      path: '/client/analytics',
      icon: BarChart3
    },
    {
      name: 'Messages',
      path: '/client/messages',
      icon: MessageSquare
    },
    {
      name: 'AI Assistant',
      path: '/client/ai-assistant',
      icon: Sparkles
    },
    {
      name: 'Profile',
      path: '/client/profile',
      icon: Building2
    }
  ];

  return (
    <div className={`bg-card border-r border-border transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-foreground">Client Portal</h2>
                <p className="text-sm text-muted-foreground">
                  {company?.name || 'Your Company'}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/client'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          {!isCollapsed ? (
            <div>
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || 'Client User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.email}
              </p>
            </div>
          ) : (
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold">
                {profile?.full_name?.[0] || 'C'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};