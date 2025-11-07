import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Client } from '@/types';

const credentialsSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

interface ClientCredentialsDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientCredentialsDialog: React.FC<ClientCredentialsDialogProps> = ({
  client,
  open,
  onOpenChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [existingUser, setExistingUser] = useState<{ email: string; created_at: string; id: string } | null>(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const { toast } = useToast();

  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (client && open) {
      checkExistingUser();
      form.reset({
        email: client.email || '',
        password: '',
      });
    }
  }, [client, open]);

  const checkExistingUser = async () => {
    if (!client) return;
    
    setCheckingUser(true);
    try {
      // Check if a user exists with this company_id in profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .eq('company_id', client.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking user:', error);
      } else if (profile) {
        setExistingUser(profile);
      } else {
        setExistingUser(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSubmit = async (data: CredentialsFormData) => {
    if (!client) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data: userData, error: authError } = await supabase.functions.invoke('create-client-user', {
        body: {
          email: data.email,
          password: data.password,
          company_name: client.company_name,
          company_id: client.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (authError) {
        throw authError;
      }

      toast({
        title: 'Success',
        description: `Portal credentials created successfully for ${data.email}`,
      });

      // Refresh user status
      await checkExistingUser();
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating credentials:', error);
      
      let errorMessage = 'Failed to create portal credentials';
      if (error.message?.includes('already been registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!existingUser) return;

    setIsResetting(true);
    try {
      const redirectUrl = `${window.location.origin}/client/login`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(existingUser.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Email Sent',
        description: `A password reset link has been sent to ${existingUser.email}`,
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdatePassword = async (data: { password: string }) => {
    if (!existingUser) return;

    setIsUpdatingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { error } = await supabase.functions.invoke('update-client-password', {
        body: {
          user_id: existingUser.id,
          new_password: data.password,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Password Updated',
        description: `Password successfully updated for ${existingUser.email}`,
      });

      form.reset();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Client Portal Credentials
          </DialogTitle>
          <DialogDescription>
            Manage portal access for {client.company_name}
          </DialogDescription>
        </DialogHeader>

        {checkingUser ? (
          <div className="py-8 text-center text-muted-foreground">
            Checking existing credentials...
          </div>
        ) : existingUser ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-green-900">Portal Access Active</p>
                    <p className="text-sm text-green-700 mt-1">
                      Email: <span className="font-mono">{existingUser.email}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Created: {new Date(existingUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="ml-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isResetting ? 'Sending...' : 'Reset Password'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  This client already has portal access. They can log in at{' '}
                  <span className="font-semibold">/client/login</span>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">
                To create additional credentials or reset password, use the form below:
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <XCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">No Portal Access</p>
              <p className="text-sm text-amber-700 mt-1">
                This client does not have portal credentials yet.
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(existingUser ? handleUpdatePassword : handleSubmit)} className="space-y-4">
            {!existingUser && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portal Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="client@company.com"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Email address for client portal login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{existingUser ? 'New Password' : 'Portal Password'}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Minimum 8 characters"
                      disabled={isLoading || isUpdatingPassword}
                    />
                  </FormControl>
                  <FormDescription>
                    {existingUser 
                      ? 'Enter a new password to update the client account'
                      : 'Password for client portal access (min. 8 characters)'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!existingUser && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  ℹ️ The client will be able to login at{' '}
                  <span className="font-semibold text-foreground">/client/login</span> with
                  these credentials to view their inventory, orders, and products.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isUpdatingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUpdatingPassword}>
                {isLoading || isUpdatingPassword 
                  ? 'Processing...' 
                  : existingUser 
                    ? 'Update Password' 
                    : 'Create Credentials'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
