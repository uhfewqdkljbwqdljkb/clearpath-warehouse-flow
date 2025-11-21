import React, { useState, useEffect } from 'react';
import { AIChat } from '@/components/ai/AIChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Plus, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoadingConversations(true);
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load conversations');
      console.error(error);
    } else {
      setConversations(data || []);
    }
    setIsLoadingConversations(false);
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
  };

  const handleConversationCreated = () => {
    loadConversations();
  };

  return (
    <div className="h-full flex gap-4">
      {/* Sidebar */}
      <Card className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
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
        
        <ScrollArea className="flex-1 p-2">
          {isLoadingConversations ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={selectedConversationId === conv.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {conv.conversation_title || 'New Conversation'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Get intelligent insights and recommendations for your warehouse operations
              </p>
            </div>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <AIChat 
            context="general" 
            conversationId={selectedConversationId}
            onConversationCreated={handleConversationCreated}
          />
        </Card>
      </div>
    </div>
  );
}