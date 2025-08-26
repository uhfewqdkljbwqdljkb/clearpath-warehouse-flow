import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ClientLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const { signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      const { error } = await signUp(email, password, fullName, 'client');
      if (error) {
        toast({
          title: 'Sign Up Failed',
          description: error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Login Failed',
          description: error,
          variant: 'destructive',
        });
      } else {
        navigate('/portal');
      }
    }
  };

  const fillDemoCredentials = () => {
    setEmail('client@techshop.com');
    setPassword('password123');
  };

  const loginAsDemo = async () => {
    const { error } = await signIn('client@techshop.com', 'password123');
    if (error) {
      toast({
        title: 'Demo Login Failed',
        description: error,
        variant: 'destructive',
      });
    } else {
      navigate('/portal');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Client portal branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-16">
        <div className="max-w-lg text-center">
          <Building className="h-20 w-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Client Portal
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Access your inventory, track orders, and manage your warehouse operations with ease.
          </p>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">What you can do:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• View real-time inventory levels</li>
              <li>• Track order status and shipments</li>
              <li>• Monitor storage utilization</li>
              <li>• Access detailed analytics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600">
              {isSignUp ? 'Sign up for your client account' : 'Sign in to your client portal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12"
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
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>

            {!isSignUp && (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fillDemoCredentials}
                  className="w-full"
                >
                  Fill Demo Credentials
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={loginAsDemo}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Quick Demo Login'}
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <Link 
                to="/admin/login" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};