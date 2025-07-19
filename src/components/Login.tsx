import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import warehouseIsometric from '@/assets/warehouse-isometric.png';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Left side - Warehouse illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-lg">
          <img 
            src={warehouseIsometric} 
            alt="Modern warehouse operations" 
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Sign in</h1>
            <p className="mt-2 text-gray-600">Sign in to access your warehouse dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Demo Accounts:</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fillDemoCredentials('admin')}
                className="text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Admin Demo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fillDemoCredentials('client')}
                className="text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Client Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};