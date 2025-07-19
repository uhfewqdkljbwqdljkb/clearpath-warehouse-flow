import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Login } from "@/components/Login";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Dashboard } from "@/components/Dashboard";
import { Inventory } from "@/pages/Inventory";
import { Locations } from "@/pages/Locations";
import { Users } from "@/pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="locations" element={<Locations />} />
                <Route path="users" element={<Users />} />
                <Route path="orders" element={<div>Orders - Coming Soon</div>} />
                <Route path="receiving" element={<div>Receiving - Coming Soon</div>} />
                <Route path="shipping" element={<div>Shipping - Coming Soon</div>} />
                <Route path="reports" element={<div>Reports - Coming Soon</div>} />
                <Route path="settings" element={<div>Settings - Coming Soon</div>} />
                <Route path="my-orders" element={<div>My Orders - Coming Soon</div>} />
                <Route path="inventory-levels" element={<Inventory />} />
                <Route path="order-history" element={<div>Order History - Coming Soon</div>} />
                <Route path="contact" element={<div>Contact - Coming Soon</div>} />
              </Route>
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
