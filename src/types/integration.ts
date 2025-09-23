// Enhanced types for admin-client portal integration
export type UserRole = 'super_admin' | 'warehouse_manager' | 'logistics_coordinator' | 'client_admin' | 'client_user' | 'admin' | 'client';

export interface EnhancedProfile {
  id: string;
  user_id: string;
  company_id?: string;
  email: string;
  full_name?: string;
  role: UserRole | string; // Allow both for compatibility
  created_at: string;
  updated_at: string;
}


export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  company_id?: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  company_id?: string;
  subject: string;
  content: string;
  message_type: 'general' | 'support' | 'billing' | 'urgent' | 'system' | string; // Allow flexibility
  priority: 'low' | 'normal' | 'high' | 'urgent' | string; // Allow flexibility
  status: 'unread' | 'read' | 'archived' | string; // Allow flexibility
  thread_id?: string;
  attachment_urls?: string[];
  is_system_message: boolean;
  created_at: string;
  updated_at: string;
  sender?: EnhancedProfile;
  recipient?: EnhancedProfile;
}

export interface AdminSession {
  id: string;
  admin_user_id: string;
  viewed_client_id: string;
  session_start: string;
  session_end?: string;
  notes?: string;
  created_at: string;
}

export interface ClientActivityLog {
  id: string;
  user_id: string;
  company_id: string;
  activity_type: string;
  activity_description?: string;
  metadata: Record<string, any> | any; // Allow JSON compatibility
  ip_address?: string | null | unknown; // Allow database unknown type
  user_agent?: string;
  created_at: string;
}

export interface ClientPortalStats {
  total_products: number;
  total_inventory_items: number;
  total_inventory_value: number;
  active_orders: number;
  recent_activity_count: number;
  last_login: string;
  storage_utilization_percentage: number;
}

export interface AdminClientView {
  company: {
    id: string;
    name: string;
    client_code: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    is_active: boolean;
    contract_start_date?: string;
    contract_end_date?: string;
    max_storage_cubic_feet?: number;
    monthly_fee?: number;
  };
  stats: ClientPortalStats;
  users: EnhancedProfile[];
  recent_activity: ClientActivityLog[];
  recent_messages: Message[];
}

export interface ViewAsClientContext {
  isViewingAsClient: boolean;
  adminUser: EnhancedProfile | null;
  clientCompany: AdminClientView['company'] | null;
  sessionId: string | null;
  startViewingAsClient: (companyId: string) => Promise<void>;
  stopViewingAsClient: () => Promise<void>;
}