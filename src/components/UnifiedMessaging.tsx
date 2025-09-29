import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Building2
} from 'lucide-react';
import { Message, EnhancedProfile } from '@/types/integration';
import { useMessageSync } from '@/hooks/useRealTimeSync';

export const UnifiedMessaging: React.FC = () => {
  const { profile } = useAuth();
  const { isViewingAsClient, clientCompany } = useIntegration();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<EnhancedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showNewMessage, setShowNewMessage] = useState(false);

  // New message form state
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    message_type: 'general' as const,
    priority: 'normal' as const
  });

  // Real-time message sync
  useMessageSync((payload) => {
    console.log('Real-time message update:', payload);
    if (payload.eventType === 'INSERT') {
      setMessages(prev => [payload.new as Message, ...prev]);
      // Show toast notification for new messages
      if (payload.new.recipient_id === profile?.user_id) {
        toast({
          title: "New Message",
          description: `${payload.new.subject} from ${payload.new.sender?.full_name || 'someone'}`,
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      setMessages(prev => prev.map(msg => 
        msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
      ));
    }
  });

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [profile?.user_id, isViewingAsClient, clientCompany]);

  const fetchMessages = async () => {
    if (!profile?.user_id) return;

    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      // Filter messages based on context
      if (isViewingAsClient && clientCompany) {
        query = query.eq('company_id', clientCompany.id);
      } else {
        query = query.or(`sender_id.eq.${profile.user_id},recipient_id.eq.${profile.user_id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch messages."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      let query = supabase.from('profiles').select('*');
      
      if (isViewingAsClient && clientCompany) {
        // If viewing as client, only show users from that company plus admins
        query = query.or(`company_id.eq.${clientCompany.id},role.eq.admin`);
      } else if (profile?.role === 'admin') {
        // If user is admin (not viewing as client), show all users
        query = query.neq('user_id', profile.user_id); // Exclude self
      } else {
        // For regular users, show only admins and users from their company
        query = query.or(`role.eq.admin,company_id.eq.${profile?.company_id}`);
        query = query.neq('user_id', profile?.user_id); // Exclude self
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const sendMessage = async () => {
    if (!profile?.user_id || !newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }

    try {
      const messageData = {
        sender_id: profile.user_id,
        recipient_id: newMessage.recipient_id,
        company_id: isViewingAsClient ? clientCompany?.id : profile.company_id,
        subject: newMessage.subject,
        content: newMessage.content,
        message_type: newMessage.message_type,
        priority: newMessage.priority,
        status: 'unread'
      };

      const { error } = await supabase.from('messages').insert([messageData]);

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully."
      });

      setNewMessage({
        recipient_id: '',
        subject: '',
        content: '',
        message_type: 'general',
        priority: 'normal'
      });
      setShowNewMessage(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message."
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', messageId);
      
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'read': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesType = filterType === 'all' || message.message_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Messages</h2>
          {isViewingAsClient && clientCompany && (
            <Badge variant="outline" className="ml-2">
              <Building2 className="h-3 w-3 mr-1" />
              {clientCompany.name}
            </Badge>
          )}
        </div>
        
        <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={newMessage.recipient_id} onValueChange={(value) => 
                    setNewMessage(prev => ({ ...prev, recipient_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(user => user.role === 'admin').length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Admin Users</div>
                          {users.filter(user => user.role === 'admin').map(user => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {user.full_name || user.email}
                                <Badge variant="outline" className="ml-2">Admin</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {users.filter(user => user.role === 'client').length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Client Users</div>
                          {users.filter(user => user.role === 'client').map(user => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {user.full_name || user.email}
                                <Badge variant="outline" className="ml-2">Client</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newMessage.priority} onValueChange={(value: any) => 
                    setNewMessage(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                  Cancel
                </Button>
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No messages found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map(message => (
            <Card 
              key={message.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                message.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => message.status === 'unread' && markAsRead(message.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(message.status)}
                      <h3 className={`font-medium ${message.status === 'unread' ? 'font-semibold' : ''}`}>
                        {message.subject}
                      </h3>
                      <Badge variant="outline" className={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {message.message_type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {message.content.length > 200 
                        ? `${message.content.substring(0, 200)}...`
                        : message.content
                      }
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>From: {message.sender?.full_name || message.sender?.email}</span>
                      {message.recipient && (
                        <span>To: {message.recipient.full_name || message.recipient.email}</span>
                      )}
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};