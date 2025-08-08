import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Phone, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for conversations and messages
const mockConversations = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Warehouse Manager",
    lastMessage: "The shipment for order #12345 is ready",
    timestamp: "2 min ago",
    unread: 2,
    avatar: "/avatars/sarah.jpg",
    online: true
  },
  {
    id: 2,
    name: "Mike Chen",
    role: "Logistics Coordinator",
    lastMessage: "Can you check the inventory levels for...",
    timestamp: "15 min ago",
    unread: 0,
    avatar: "/avatars/mike.jpg",
    online: false
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Operations Director",
    lastMessage: "Great work on the quarterly report!",
    timestamp: "1 hour ago",
    unread: 1,
    avatar: "/avatars/emily.jpg",
    online: true
  },
  {
    id: 4,
    name: "Warehouse Team",
    role: "Group Chat",
    lastMessage: "Alex: Location CLPRW0004 needs attention",
    timestamp: "2 hours ago",
    unread: 0,
    avatar: "/avatars/team.jpg",
    online: false
  }
];

const mockMessages = [
  {
    id: 1,
    senderId: 1,
    senderName: "Sarah Johnson",
    message: "Hey! The shipment for order #12345 is ready for pickup.",
    timestamp: "10:24 AM",
    isOwn: false
  },
  {
    id: 2,
    senderId: "me",
    senderName: "You",
    message: "Perfect! I'll send the pickup truck over in 30 minutes.",
    timestamp: "10:25 AM",
    isOwn: true
  },
  {
    id: 3,
    senderId: 1,
    senderName: "Sarah Johnson",
    message: "Sounds good. The items are staged at dock door 3. Do you need me to prepare any special documentation?",
    timestamp: "10:26 AM",
    isOwn: false
  },
  {
    id: 4,
    senderId: "me",
    senderName: "You",
    message: "Yes, please prepare the standard shipping manifest. Also, can you double-check the quantities in location CLPRW0004?",
    timestamp: "10:28 AM",
    isOwn: true
  },
  {
    id: 5,
    senderId: 1,
    senderName: "Sarah Johnson",
    message: "Already on it! I've verified all quantities and everything matches the order. Manifest will be ready when the truck arrives.",
    timestamp: "10:30 AM",
    isOwn: false
  }
];

export const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversations Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Messages</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                    selectedConversation.id === conversation.id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar} alt={conversation.name} />
                      <AvatarFallback>
                        {conversation.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conversation.name}</p>
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      {conversation.unread > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{conversation.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                  <AvatarFallback>
                    {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {selectedConversation.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{selectedConversation.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedConversation.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.isOwn && "flex-row-reverse"
                  )}
                >
                  {!message.isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                      <AvatarFallback>
                        {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "flex flex-col gap-1 max-w-[70%]",
                    message.isOwn && "items-end"
                  )}>
                    <div className={cn(
                      "px-3 py-2 rounded-lg",
                      message.isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};