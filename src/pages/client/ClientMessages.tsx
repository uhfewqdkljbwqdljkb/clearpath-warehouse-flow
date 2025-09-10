import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Clock, CheckCircle, AlertTriangle, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    content: string;
    sender: 'client' | 'warehouse';
    timestamp: string;
    attachments?: string[];
  }>;
}

export const ClientMessages: React.FC = () => {
  const { profile, company } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageForm, setNewMessageForm] = useState({
    subject: '',
    category: '',
    priority: 'medium' as const,
    content: ''
  });

  // Mock messages data
  const mockMessages: Message[] = [
    {
      id: '1',
      subject: 'Stock Discrepancy - iPhone Cases',
      category: 'Inventory Issues',
      priority: 'high',
      status: 'in_progress',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T14:20:00Z',
      messages: [
        {
          id: '1-1',
          content: 'We noticed a discrepancy in our iPhone Cases stock count. Our system shows 450 units but your last report indicated 430. Can you please verify the actual count?',
          sender: 'client',
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          id: '1-2',
          content: 'Thank you for bringing this to our attention. We have initiated a physical count of your iPhone Cases inventory. Our warehouse team is currently verifying the stock levels and will provide an update within 2 hours.',
          sender: 'warehouse',
          timestamp: '2024-01-15T11:15:00Z'
        },
        {
          id: '1-3',
          content: 'Physical count completed. The actual stock is 445 units. There were 5 units in the processing area that were not yet logged into the system. We have updated the system and implemented additional scanning checkpoints to prevent this in the future.',
          sender: 'warehouse',
          timestamp: '2024-01-15T14:20:00Z'
        }
      ]
    },
    {
      id: '2',
      subject: 'Rush Order Request - Wireless Earbuds',
      category: 'Order Support',
      priority: 'critical',
      status: 'resolved',
      created_at: '2024-01-14T16:45:00Z',
      updated_at: '2024-01-14T18:30:00Z',
      messages: [
        {
          id: '2-1',
          content: 'We have an urgent order that needs to be shipped today before 6 PM. Order #ORD-12340 for 50 Wireless Earbuds Pro. Customer is willing to pay rush shipping fees.',
          sender: 'client',
          timestamp: '2024-01-14T16:45:00Z'
        },
        {
          id: '2-2',
          content: 'Rush order confirmed. We have prioritized this order and it is currently being picked. Expected completion: 5:30 PM. Aramex has been notified for immediate pickup. Rush fee: $25.',
          sender: 'warehouse',
          timestamp: '2024-01-14T17:00:00Z'
        },
        {
          id: '2-3',
          content: 'Order shipped at 5:25 PM via Aramex. Tracking number: AR789012345. Rush fee has been added to your monthly invoice.',
          sender: 'warehouse',
          timestamp: '2024-01-14T18:30:00Z'
        }
      ]
    },
    {
      id: '3',
      subject: 'Storage Expansion Request',
      category: 'Account Management',
      priority: 'medium',
      status: 'open',
      created_at: '2024-01-13T09:20:00Z',
      updated_at: '2024-01-13T09:20:00Z',
      messages: [
        {
          id: '3-1',
          content: 'Our business is growing and we need additional storage space. Currently using 68.5% of our allocated 6.1 m³. Would like to expand to 10 m³ total capacity. What would be the additional monthly cost?',
          sender: 'client',
          timestamp: '2024-01-13T09:20:00Z'
        }
      ]
    }
  ];

  const displayMessages = messages.length > 0 ? messages : mockMessages;

  const categories = [
    'Inventory Issues',
    'Order Support', 
    'Account Management',
    'Technical Support',
    'Billing Questions',
    'General Inquiry'
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendMessage = () => {
    // In a real app, this would send the message to the API
    console.log('Sending message:', newMessageForm);
    setShowNewMessage(false);
    setNewMessageForm({ subject: '', category: '', priority: 'medium', content: '' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (showNewMessage) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Message</h1>
            <p className="text-muted-foreground">Contact the warehouse team</p>
          </div>
          <Button variant="outline" onClick={() => setShowNewMessage(false)}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Message to Warehouse Team</CardTitle>
            <CardDescription>Describe your issue or request in detail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newMessageForm.subject}
                  onChange={(e) => setNewMessageForm({...newMessageForm, subject: e.target.value})}
                  placeholder="Brief description of your request"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newMessageForm.category} onValueChange={(value) => setNewMessageForm({...newMessageForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={newMessageForm.priority} onValueChange={(value: any) => setNewMessageForm({...newMessageForm, priority: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={newMessageForm.content}
                onChange={(e) => setNewMessageForm({...newMessageForm, content: e.target.value})}
                placeholder="Provide detailed information about your request or issue..."
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedMessage) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button variant="outline" onClick={() => setSelectedMessage(null)} className="mb-2">
              ← Back to Messages
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{selectedMessage.subject}</h1>
          </div>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(selectedMessage.priority)}>
              {selectedMessage.priority}
            </Badge>
            <Badge className={getStatusColor(selectedMessage.status)}>
              {selectedMessage.status}
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {selectedMessage.messages.map((msg, index) => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    msg.sender === 'client' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {msg.sender === 'client' ? 'You' : 'Warehouse Team'}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedMessage.status !== 'closed' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input placeholder="Type your reply..." className="flex-1" />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communication with warehouse operations team</p>
        </div>
        <Button onClick={() => setShowNewMessage(true)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      {/* Message Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Open</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayMessages.filter(m => m.status === 'open').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayMessages.filter(m => m.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Resolved</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayMessages.filter(m => m.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayMessages.filter(m => m.priority === 'critical').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Your communication history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{message.subject}</h3>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(message.priority)} variant="secondary">
                      {message.priority}
                    </Badge>
                    <Badge className={getStatusColor(message.status)} variant="secondary">
                      {message.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{message.category}</span>
                  <span>{formatTimestamp(message.updated_at)}</span>
                </div>
                
                <p className="text-sm mt-2 line-clamp-2">
                  {message.messages[message.messages.length - 1]?.content}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};