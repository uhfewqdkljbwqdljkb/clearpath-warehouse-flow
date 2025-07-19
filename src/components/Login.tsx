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
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-50 p-16">
        <div className="max-w-lg">
          <img 
            src="/lovable-uploads/4912634c-d2f0-420c-8b10-e0a862fc5979.png" 
            alt="Modern warehouse operations" 
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Sign up</h1>
            <p className="text-gray-500 text-base">Sign up for free to access to in any of our products</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-12">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-lg border border-black bg-white px-4 py-3 text-base focus:border-black focus:ring-0 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-lg border border-black bg-white px-4 py-3 pr-12 text-base focus:border-black focus:ring-0 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  Hide
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Use 8 or more characters with a mix of letters, numbers & symbols</p>
            </div>

            <div className="space-y-3 mt-6">
              <label className="flex items-start space-x-3">
                <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-gray-300 text-black focus:ring-0" defaultChecked />
                <span className="text-sm text-gray-700">
                  Agree to our <span className="underline">Terms of use</span> and <span className="underline">Privacy Policy</span>
                </span>
              </label>
              
              <label className="flex items-start space-x-3">
                <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-gray-300 text-black focus:ring-0" defaultChecked />
                <span className="text-sm text-gray-700">Subscribe to our monthly newsletter</span>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors mt-8" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>

          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <span className="text-gray-900 font-medium cursor-pointer hover:underline">
                Log in
              </span>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">Demo Accounts:</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fillDemoCredentials('admin')}
                className="text-sm border-gray-200 bg-white text-gray-600 hover:bg-white shadow-md h-10 rounded-lg"
              >
                Admin Demo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fillDemoCredentials('client')}
                className="text-sm border-gray-200 bg-white text-gray-600 hover:bg-white shadow-md h-10 rounded-lg"
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