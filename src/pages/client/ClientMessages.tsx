import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Send, 
  Inbox, 
  Mail, 
  MailOpen, 
  Plus,
  CheckCircle2,
  Search,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string | null;
  company_id: string | null;
  status: string;
  priority: string;
  message_type: string;
  created_at: string;
  read_at: string | null;
  sender_profile?: {
    full_name: string | null;
    email: string;
  };
  recipient_profile?: {
    full_name: string | null;
    email: string;
  };
}

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export const ClientMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    priority: 'normal',
    message_type: 'general',
  });

  useEffect(() => {
    fetchMessages();
    fetchAdminUsers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMessages = async () => {
    if (!user?.id) return;
    
    try {
      // Get messages where user is sender or recipient
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set([
        ...messagesData.map(m => m.sender_id).filter(Boolean),
        ...messagesData.map(m => m.recipient_id).filter(Boolean)
      ])];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Map profiles to messages
      const enrichedMessages: Message[] = messagesData.map(msg => ({
        ...msg,
        sender_profile: profiles?.find(p => p.id === msg.sender_id),
        recipient_profile: profiles?.find(p => p.id === msg.recipient_id)
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      // Use secure function to get staff members (only exposes name, not email/phone)
      const { data: staffData, error } = await supabase
        .rpc('get_staff_for_messaging');

      if (error) throw error;

      const admins: AdminUser[] = (staffData || []).map((staff: any) => ({
        id: staff.user_id,
        full_name: staff.full_name,
        email: staff.full_name || 'Staff Member', // Don't expose actual email
        role: staff.role
      }));

      setAdminUsers(admins);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Error",
        description: "Please select a recipient and fill in subject and message",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user?.id,
          recipient_id: newMessage.recipient_id,
          company_id: profile?.company_id,
          subject: newMessage.subject,
          content: newMessage.content,
          priority: newMessage.priority as any,
          message_type: newMessage.message_type as any,
          status: 'unread',
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setShowNewMessage(false);
      setNewMessage({
        recipient_id: '',
        subject: '',
        content: '',
        priority: 'normal',
        message_type: 'general',
      });
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const senderName = message.sender_profile?.full_name || message.sender_profile?.email || '';
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || message.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const unreadCount = messages.filter(m => m.status === 'unread' && m.recipient_id === user?.id).length;
  const sentCount = messages.filter(m => m.sender_id === user?.id).length;
  const receivedCount = messages.filter(m => m.recipient_id === user?.id).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'text-green-600 bg-green-50';
      case 'billing':
        return 'text-yellow-600 bg-yellow-50';
      case 'support':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSenderDisplay = (message: Message) => {
    if (message.sender_id === user?.id) {
      return { name: 'You', subtitle: '' };
    }
    const name = message.sender_profile?.full_name || message.sender_profile?.email || 'Unknown';
    const admin = adminUsers.find(a => a.id === message.sender_id);
    const subtitle = admin ? formatRole(admin.role) : '';
    return { name, subtitle };
  };

  const getRecipientDisplay = (message: Message) => {
    if (message.recipient_id === user?.id) {
      return 'You';
    }
    return message.recipient_profile?.full_name || message.recipient_profile?.email || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with warehouse staff
          </p>
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
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Send a message to warehouse staff
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient</label>
                <Select 
                  value={newMessage.recipient_id} 
                  onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member...">
                      {newMessage.recipient_id && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {adminUsers.find(u => u.id === newMessage.recipient_id)?.full_name || 
                           adminUsers.find(u => u.id === newMessage.recipient_id)?.email}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.map((adminUser) => (
                      <SelectItem key={adminUser.id} value={adminUser.id}>
                        <div className="flex flex-col">
                          <span>{adminUser.full_name || adminUser.email}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRole(adminUser.role)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select 
                    value={newMessage.priority} 
                    onValueChange={(value) => setNewMessage({...newMessage, priority: value})}
                  >
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
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select 
                    value={newMessage.message_type} 
                    onValueChange={(value) => setNewMessage({...newMessage, message_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input 
                  placeholder="Message subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea 
                  placeholder="Type your message here..."
                  rows={6}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={!newMessage.recipient_id}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">New messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentCount}</div>
            <p className="text-xs text-muted-foreground">Messages sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedCount}</div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No messages found matching your filters.' 
                  : 'No messages yet. Start a conversation!'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => {
                    const sender = getSenderDisplay(message);
                    return (
                      <TableRow 
                        key={message.id}
                        className={message.status === 'unread' && message.recipient_id === user?.id ? 'bg-blue-50/50' : ''}
                      >
                        <TableCell>
                          {message.status === 'unread' ? (
                            <Mail className="h-4 w-4 text-blue-600" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sender.name}</div>
                            {sender.subtitle && (
                              <div className="text-xs text-muted-foreground">{sender.subtitle}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getRecipientDisplay(message)}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{message.subject}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-md">
                              {message.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(message.message_type)}>
                            {message.message_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(message.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {message.status === 'unread' && message.recipient_id === user?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(message.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
