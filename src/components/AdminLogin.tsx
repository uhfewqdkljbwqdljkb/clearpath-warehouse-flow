import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clearpathLogo from '@/assets/clearpath-logo.png';
export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    signIn,
    isLoading
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      error
    } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Login Failed',
        description: error,
        variant: 'destructive'
      });
    } else {
      navigate('/dashboard');
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <img src={clearpathLogo} alt="ClearPath Logistics" className="h-16 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Login
          </h1>
          <p className="text-gray-600">
            Access the warehouse management system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </Label>
            <Input id="email" type="email" placeholder="admin@clearpath.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full" required />
          </div>
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pr-12" required />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? 'Please wait...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <div className="pt-4 border-t border-gray-200">
            <Link to="/client/login" className="text-sm text-gray-600 hover:text-gray-800">
              Are you a client? Access Client Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>;
};