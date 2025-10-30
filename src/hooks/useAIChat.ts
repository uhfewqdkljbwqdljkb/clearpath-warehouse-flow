import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
  created_at: string;
}

interface UseAIChatProps {
  conversationId?: string;
  context?: 'inventory' | 'orders' | 'warehouse' | 'products' | 'general';
}

export function useAIChat({ conversationId: initialConversationId, context = 'general' }: UseAIChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const { toast } = useToast();

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        reasoning_content: msg.reasoning_content || undefined,
        created_at: msg.created_at
      })));
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const createConversation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          company_id: profile?.company_id,
          context_type: context,
          conversation_title: 'New Conversation'
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [context]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    let currentConvId = conversationId;

    try {
      // Create conversation if needed
      if (!currentConvId) {
        currentConvId = await createConversation();
      }

      // Add user message to UI
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Save user message to database
      await supabase.from('ai_messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content
      });

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Call AI assistant edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            conversationId: currentConvId,
            context
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 402) {
          throw new Error(errorData.message || 'DeepSeek API account needs to be topped up with credits. Please add funds at https://platform.deepseek.com');
        }
        
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      
      if (!response.body) {
        throw new Error('No response body from AI');
      }

      // Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = crypto.randomUUID();

      // Add placeholder assistant message
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch (e) {
            // Ignore parse errors for incomplete JSON
          }
        }
      }

      // Save assistant message to database
      if (assistantContent) {
        await supabase.from('ai_messages').insert({
          conversation_id: currentConvId,
          role: 'assistant',
          content: assistantContent
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messages, context, createConversation, toast]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    loadConversation,
    clearConversation
  };
}