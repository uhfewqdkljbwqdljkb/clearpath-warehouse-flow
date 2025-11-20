import React, { useState, useEffect } from 'react';
import { AIChat } from '@/components/ai/AIChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  conversation_title: string | null;
  created_at: string;
  updated_at: string;
}

export default function ClientAIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (data) {
      setConversations(data);
    }
  };

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
    loadConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Conversation History Sidebar */}
      {showHistory && (
        <div className="w-64 flex flex-col bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewConversation}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors",
                    "hover:bg-accent group",
                    selectedConversationId === conv.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.conversation_title || 'New Conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(conv.updated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Your warehouse management assistant
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-card border rounded-lg overflow-hidden flex flex-col">
          <AIChat 
            context="general" 
            conversationId={selectedConversationId}
            onConversationCreated={loadConversations}
          />
        </div>
      </div>
    </div>
  );
}