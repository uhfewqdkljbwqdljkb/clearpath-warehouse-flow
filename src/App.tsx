import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminLogin } from "@/components/AdminLogin";
import { ClientLogin } from "@/components/ClientLogin";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ClientPortalLayout } from "@/components/ClientPortalLayout";
import { Dashboard } from "@/components/Dashboard";
import { Warehouse } from "@/pages/Warehouse";
import { Messages } from "@/pages/Messages";
import { Users } from "@/pages/Users";
import { Clients } from "@/pages/Clients";
import { Products } from "@/pages/Products";
import { ClientPortalDashboard } from "@/pages/portal/ClientPortalDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !profile) {
    return <AdminLogin />;
  }
  
  if (profile.role !== 'admin') {
    return <Navigate to="/portal" replace />;
  }
  
  return <>{children}</>;
};

const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !profile) {
    return <ClientLogin />;
  }
  
  if (profile.role !== 'client') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const RoleBasedRedirect = () => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !profile) {
    return <AdminLogin />;
  }
  
  if (profile.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/portal" replace />;
  }
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Root route - redirects based on role */}
              <Route path="/" element={<RoleBasedRedirect />} />
              
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <DashboardLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Route>
              
              {/* Admin dashboard routes */}
              <Route path="/dashboard" element={
                <AdminProtectedRoute>
                  <DashboardLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="warehouse" element={<Warehouse />} />
                <Route path="messages" element={<Messages />} />
                <Route path="users" element={<Users />} />
                <Route path="clients" element={<Clients />} />
                <Route path="products" element={<Products />} />
              </Route>
              
              {/* Legacy admin routes (redirect to new structure) */}
              <Route path="/warehouse" element={<Navigate to="/dashboard/warehouse" replace />} />
              <Route path="/messages" element={<Navigate to="/dashboard/messages" replace />} />
              <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
              <Route path="/clients" element={<Navigate to="/dashboard/clients" replace />} />
              <Route path="/products" element={<Navigate to="/dashboard/products" replace />} />
              
              {/* Client portal routes */}
              <Route path="/portal/login" element={<ClientLogin />} />
              <Route path="/portal" element={
                <ClientProtectedRoute>
                  <ClientPortalLayout />
                </ClientProtectedRoute>
              }>
                <Route index element={<ClientPortalDashboard />} />
                <Route path="inventory" element={<div>Client Inventory Page</div>} />
                <Route path="orders" element={<div>Client Orders Page</div>} />
                <Route path="storage" element={<div>Client Storage Page</div>} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;