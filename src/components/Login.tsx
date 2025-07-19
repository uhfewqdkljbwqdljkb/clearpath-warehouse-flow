import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Warehouse, Lock, Mail } from 'lucide-react';
import warehouseHero from '@/assets/warehouse-hero.jpg';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (!success) {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Try admin@clearpath.com or client@acme.com with password "password"',
        variant: 'destructive',
      });
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'client') => {
    if (role === 'admin') {
      setEmail('admin@clearpath.com');
      setPassword('password');
    } else {
      setEmail('client@acme.com');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src={warehouseHero} 
          alt="Modern warehouse" 
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <Warehouse className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Clearpath WMS</h1>
            <p className="text-xl">Modern Warehouse Management System</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4 lg:hidden">
              <Warehouse className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold">Clearpath</span>
            </div>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your warehouse dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground text-center">Demo Accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fillDemoCredentials('admin')}
                  className="text-xs"
                >
                  Admin Demo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fillDemoCredentials('client')}
                  className="text-xs"
                >
                  Client Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};