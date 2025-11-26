import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import { AdminLogin } from "@/components/AdminLogin";
import { ClientLogin } from "@/components/ClientLogin";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ClientLayout } from "@/components/ClientLayout";
import { Dashboard } from "@/components/Dashboard";
import { AdminDashboardEnhancements } from "@/components/AdminDashboardEnhancements";
import { Warehouse } from "@/pages/Warehouse";
import { Messages } from "@/pages/Messages";
import { Users } from "@/pages/Users";
import { Clients } from "@/pages/Clients";
import { Products } from "@/pages/Products";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientDashboard } from "@/pages/client/ClientDashboard";
import { ClientProducts } from "@/pages/client/ClientProducts";
import { ClientOrders } from "@/pages/client/ClientOrders";
import { ClientAnalytics } from "@/pages/client/ClientAnalytics";
import { ClientMessages } from "@/pages/client/ClientMessages";
import { ClientProfile } from "@/pages/client/ClientProfile";
import { ClientCheckIn } from "@/pages/client/ClientCheckIn";
import { ClientCheckOut } from "@/pages/client/ClientCheckOut";
import { ClientRequests } from "@/pages/client/ClientRequests";
import { CheckInRequests } from "@/pages/CheckInRequests";
import { CheckOutRequests } from "@/pages/CheckOutRequests";
import { ShipProducts } from "@/pages/ShipProducts";
import { RealTimeNotifications } from "@/components/RealTimeNotifications";
import AIAssistant from "@/pages/AIAssistant";
import ClientAIAssistant from "@/pages/client/ClientAIAssistant";

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

  // Check if user has an admin-type role
  const adminRoles = ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'];
  const clientRoles = ['client', 'client_admin', 'client_user'];
  const isAdminRole = adminRoles.includes(profile.role);
  const isClientRole = clientRoles.includes(profile.role);

  if (requiredRole === 'admin' && !isAdminRole) {
    if (isClientRole) {
      return <Navigate to="/client" replace />;
    }
  } else if (requiredRole === 'client' && !isClientRole) {
    if (isAdminRole) {
      return <Navigate to="/dashboard" replace />;
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
    const adminRoles = ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'];
    const clientRoles = ['client', 'client_admin', 'client_user'];
    
    if (adminRoles.includes(profile.role)) {
      return <Navigate to="/dashboard" replace />;
    } else if (clientRoles.includes(profile.role)) {
      return <Navigate to="/client" replace />;
    }
  }
  
  return <AdminLogin />;
};

const RootRedirect = () => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user && profile) {
    const adminRoles = ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'];
    const clientRoles = ['client', 'client_admin', 'client_user'];
    
    if (adminRoles.includes(profile.role)) {
      return <Navigate to="/dashboard" replace />;
    } else if (clientRoles.includes(profile.role)) {
      return <Navigate to="/client" replace />;
    }
  }
  
  // Default to admin login for unauthenticated users
  return <Navigate to="/dashboard/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IntegrationProvider>
          <TooltipProvider>
            <RealTimeNotifications />
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
                <Route path="clients/:clientId/products" element={<Products />} />
                <Route path="products" element={<Products />} />
                <Route path="check-in-requests" element={<CheckInRequests />} />
                <Route path="check-out-requests" element={<CheckOutRequests />} />
                <Route path="ship-products" element={<ShipProducts />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
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
                <Route path="check-in" element={<ClientCheckIn />} />
                <Route path="check-out" element={<ClientCheckOut />} />
                <Route path="requests" element={<ClientRequests />} />
                <Route path="orders" element={<ClientOrders />} />
              <Route path="analytics" element={<ClientAnalytics />} />
              <Route path="messages" element={<ClientMessages />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="ai-assistant" element={<ClientAIAssistant />} />
              </Route>
              
              {/* Redirect root to appropriate dashboard */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Redirect all other routes to appropriate login */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
        </IntegrationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;