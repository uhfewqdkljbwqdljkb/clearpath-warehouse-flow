import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeUserManagement } from '@/components/EmployeeUserManagement';
import { ClientUserManagement } from '@/components/ClientUserManagement';
import { Users as UsersIcon, UserCheck, UserPlus, Shield } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'];
const CLIENT_ROLES = ['client', 'client_admin', 'client_user'];

export const Users: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [userStats, setUserStats] = useState({
    total: 0,
    employees: 0,
    clients: 0,
    recentSignups: 0
  });

  const isAdmin = ADMIN_ROLES.includes(profile?.role || '');

  useEffect(() => {
    if (isAdmin) {
      fetchUserStats();
    }
  }, [isAdmin]);

  const fetchUserStats = async () => {
    try {
      // Get total user count
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get role counts
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role');

      const employeeCount = rolesData?.filter(r => 
        ADMIN_ROLES.includes(r.role as string)
      ).length || 0;

      const clientCount = rolesData?.filter(r => 
        CLIENT_ROLES.includes(r.role as string)
      ).length || 0;

      // Get recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setUserStats({
        total: totalCount || 0,
        employees: employeeCount,
        clients: clientCount,
        recentSignups: recentCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Access denied. Admin privileges required to view user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage employee and client user accounts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.employees}</div>
            <p className="text-xs text-muted-foreground">
              Admin & staff
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Company portal users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.recentSignups}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Employee and Client Users */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="clients">Client Users</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="space-y-4">
          <EmployeeUserManagement />
        </TabsContent>
        <TabsContent value="clients" className="space-y-4">
          <ClientUserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
