import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { 
  ViewAsClientContext, 
  AdminSession, 
  AdminClientView, 
  ClientActivityLog,
  EnhancedProfile 
} from '@/types/integration';
import { useToast } from '@/hooks/use-toast';

const IntegrationContext = createContext<ViewAsClientContext | undefined>(undefined);

interface IntegrationProviderProps {
  children: ReactNode;
}

export const IntegrationProvider: React.FC<IntegrationProviderProps> = ({ children }) => {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const [isViewingAsClient, setIsViewingAsClient] = useState(false);
  const [adminUser, setAdminUser] = useState<EnhancedProfile | null>(null);
  const [clientCompany, setClientCompany] = useState<AdminClientView['company'] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || (profile?.role as string)?.includes('admin') || (profile?.role as string)?.includes('manager');

  const logActivity = async (activityType: string, description: string, metadata: Record<string, any> = {}) => {
    if (!profile?.user_id) return;

    try {
      const companyId = profile.company_id || clientCompany?.id;
      if (!companyId) {
        console.warn('logActivity skipped: no company_id available');
        return;
      }

      const { error } = await supabase.from('client_activity_logs').insert([{
        user_id: profile.user_id,
        company_id: companyId,
        activity_type: activityType,
        activity_description: description,
        metadata,
        ip_address: null,
        user_agent: navigator.userAgent
      }]);

      if (error) {
        console.warn('Activity logging failed:', error.message);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const startViewingAsClient = async (companyId: string) => {
    if (!isAdmin || !profile?.user_id) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only administrators can view client portals."
      });
      return;
    }

    try {
      // Get company details
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Create admin session record
      const { data: sessionData, error: sessionError } = await supabase
        .from('admin_sessions')
        .insert([{
          admin_user_id: profile.user_id,
          viewed_client_id: companyId,
          notes: `Admin ${profile.full_name || profile.email} viewing ${company.name} portal`
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Log the activity
      await logActivity(
        'admin_view_client_portal',
        `Admin started viewing ${company.name} portal`,
        { company_id: companyId, company_name: company.name }
      );

      setAdminUser(profile as EnhancedProfile);
      setClientCompany(company);
      setSessionId(sessionData.id);
      setIsViewingAsClient(true);

      toast({
        title: "Now Viewing as Client",
        description: `You are now viewing the portal for ${company.name}`,
      });
    } catch (error) {
      console.error('Error starting client view:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start viewing as client. Please try again."
      });
    }
  };

  const stopViewingAsClient = async () => {
    if (!sessionId) return;

    try {
      // End the admin session
      await supabase
        .from('admin_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Log the activity
      await logActivity(
        'admin_stop_view_client_portal',
        `Admin stopped viewing ${clientCompany?.name} portal`,
        { company_id: clientCompany?.id, company_name: clientCompany?.name }
      );

      setIsViewingAsClient(false);
      setAdminUser(null);
      setClientCompany(null);
      setSessionId(null);

      toast({
        title: "Returned to Admin View",
        description: "You have returned to the admin dashboard.",
      });
    } catch (error) {
      console.error('Error stopping client view:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to stop viewing as client."
      });
    }
  };

  // Auto-log user activity
  useEffect(() => {
    if (profile?.user_id && session) {
      logActivity('user_session_active', 'User session active', {
        role: profile.role,
        company_id: profile.company_id
      });
    }
  }, [profile?.user_id, session]);

  const value: ViewAsClientContext = {
    isViewingAsClient,
    adminUser,
    clientCompany,
    sessionId,
    startViewingAsClient,
    stopViewingAsClient,
    logActivity
  };

  return (
    <IntegrationContext.Provider value={value}>
      {children}
    </IntegrationContext.Provider>
  );
};

export const useIntegration = (): ViewAsClientContext => {
  const context = useContext(IntegrationContext);
  if (context === undefined) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  return context;
};