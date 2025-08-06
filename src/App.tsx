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
import { Locations } from "@/pages/Locations";
import { Warehouse } from "@/pages/Warehouse";
import { Users } from "@/pages/Users";
import { Clients } from "@/pages/Clients";
import { Products } from "@/pages/Products";

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
                <Route path="locations" element={<Locations />} />
                <Route path="warehouse" element={<Warehouse />} />
                <Route path="users" element={<Users />} />
                <Route path="clients" element={<Clients />} />
                <Route path="products" element={<Products />} />
                
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
