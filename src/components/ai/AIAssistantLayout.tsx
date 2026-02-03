import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, PanelLeftClose, PanelLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AIChat } from './AIChat';
import { ConversationSidebar } from './ConversationSidebar';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  conversation_title: string | null;
  context_type: string | null;
  created_at: string;
  updated_at: string;
}

interface AIAssistantLayoutProps {
  userRole: 'admin' | 'b2b_client' | 'b2c_client';
  title?: string;
  description?: string;
}

export const AIAssistantLayout: React.FC<AIAssistantLayoutProps> = ({
  userRole,
  title = 'AI Assistant',
  description,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load conversations
  const loadConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } else {
      setConversations(data || []);
    }
    setIsLoadingConversations(false);
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  const handleNewChat = () => {
    setSelectedConversationId(undefined);
    setMobileSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setMobileSidebarOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete messages first
      await supabase.from('ai_messages').delete().eq('conversation_id', id);
      // Delete conversation
      await supabase.from('ai_conversations').delete().eq('id', id);

      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(undefined);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      await supabase
        .from('ai_conversations')
        .update({ conversation_title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', id);

      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, conversation_title: newTitle } : c))
      );
      toast.success('Conversation renamed');
    } catch (error) {
      console.error('Error renaming conversation:', error);
      toast.error('Failed to rename conversation');
    }
  };

  const handleConversationCreated = () => {
    loadConversations();
  };

  const getDescription = () => {
    if (description) return description;
    switch (userRole) {
      case 'admin':
        return 'Get intelligent insights and recommendations for warehouse operations';
      case 'b2b_client':
        return 'Your business warehouse assistant - manage inventory, track orders, and more';
      case 'b2c_client':
        return 'Your personal storage assistant - check products, request checkouts, and get help';
      default:
        return 'How can I help you today?';
    }
  };

  const sidebarContent = (
    <ConversationSidebar
      conversations={conversations}
      selectedId={selectedConversationId}
      onSelect={handleSelectConversation}
      onNewChat={handleNewChat}
      onDelete={handleDelete}
      onRename={handleRename}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoadingConversations}
      isMobile={isMobile}
      onClose={() => setMobileSidebarOpen(false)}
    />
  );

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && sidebarOpen && (
        <div className="w-72 flex-shrink-0 border-r bg-card flex flex-col overflow-hidden animate-in slide-in-from-left-2 duration-200">
          {sidebarContent}
        </div>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-[300px] p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
          )}

          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {getDescription()}
            </p>
          </div>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <AIChat
            context="general"
            conversationId={selectedConversationId}
            onConversationCreated={handleConversationCreated}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
};
