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
import { ClientLayout } from "@/components/ClientLayout";
import { Dashboard } from "@/components/Dashboard";
import { Warehouse } from "@/pages/Warehouse";
import { Messages } from "@/pages/Messages";
import { Users } from "@/pages/Users";
import { Clients } from "@/pages/Clients";
import { Products } from "@/pages/Products";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientDashboard } from "@/pages/client/ClientDashboard";
import { ClientProducts } from "@/pages/client/ClientProducts";
import { ClientInventory } from "@/pages/client/ClientInventory";
import { ClientOrders } from "@/pages/client/ClientOrders";
import { ClientProfile } from "@/pages/client/ClientProfile";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'client' }) => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !profile) {
    if (requiredRole === 'client') {
      return <Navigate to="/client/login" replace />;
    }
    return <Navigate to="/dashboard/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (profile.role === 'client') {
      return <Navigate to="/client" replace />;
    }
  }
  
  return <>{children}</>;
};

const LoginRoute = () => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user && profile) {
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (profile.role === 'client') {
      return <Navigate to="/client" replace />;
    }
  }
  
  return <AdminLogin />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Login route - unprotected */}
              <Route path="/dashboard/login" element={<LoginRoute />} />
              
              {/* Dashboard routes - protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="warehouse" element={<Warehouse />} />
                <Route path="messages" element={<Messages />} />
                <Route path="users" element={<Users />} />
                <Route path="clients" element={
                  <ErrorBoundary componentName="Clients">
                    <Clients />
                  </ErrorBoundary>
                } />
                <Route path="products" element={<Products />} />
              </Route>

              {/* Client login route */}
              <Route path="/client/login" element={<ClientLogin />} />
              
              {/* Client routes - protected */}
              <Route path="/client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientLayout />
                </ProtectedRoute>
              }>
                <Route index element={<ClientDashboard />} />
                <Route path="products" element={<ClientProducts />} />
                <Route path="inventory" element={<ClientInventory />} />
                <Route path="orders" element={<ClientOrders />} />
                <Route path="profile" element={<ClientProfile />} />
              </Route>
              
              {/* Redirect root to appropriate dashboard */}
              <Route path="/" element={<Navigate to="/client/login" replace />} />
              
              {/* Redirect all other routes to client login */}
              <Route path="*" element={<Navigate to="/client/login" replace />} />
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