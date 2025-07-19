
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Warehouse, 
  FileText, 
  Smartphone, 
  Bookmark, 
  Bell,
  User,
  Settings,
  Menu
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Expenses', path: '/expenses', icon: DollarSign },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Warehouse', path: '/warehouse', icon: Warehouse },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Devices', path: '/devices', icon: Smartphone },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const clientNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const navItems = isAdmin ? adminNavItems : clientNavItems;

  return (
    <div className={`bg-white h-screen flex flex-col border-r border-gray-200 ${
      isCollapsed ? 'w-16' : 'w-64'
    } transition-all duration-300`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Clearpath</h1>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 pt-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-xs font-medium rounded-[8px] transition-colors ${
                      isActive
                        ? 'text-gray-600 hover:text-gray-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? '#00FF4DCC' : 'transparent',
                    color: isActive ? 'white' : undefined
                  })}
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
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'user@example.com'}
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
