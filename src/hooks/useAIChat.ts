import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Load conversation when conversationId changes
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
      setConversationId(initialConversationId);
    } else {
      setMessages([]);
      setConversationId(undefined);
    }
  }, [initialConversationId]);

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

  // Cancel streaming response
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  // Auto-generate title from first message
  const generateTitle = useCallback(async (convId: string, firstMessage: string) => {
    let title = firstMessage.split(/[.!?]/)[0].trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    await supabase
      .from('ai_conversations')
      .update({ conversation_title: title, updated_at: new Date().toISOString() })
      .eq('id', convId);
  }, []);

  const sendMessage = useCallback(async (content: string, isRegenerate = false) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    let currentConvId = conversationId;

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Create conversation if needed
      if (!currentConvId) {
        currentConvId = await createConversation();
      }

      // Add user message to UI (only if not regenerating)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      
      if (!isRegenerate) {
        setMessages(prev => [...prev, userMessage]);

        // Save user message to database
        await supabase.from('ai_messages').insert({
          conversation_id: currentConvId,
          role: 'user',
          content
        });

        // Generate title from first message
        if (messages.length === 0) {
          await generateTitle(currentConvId, content);
        }
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Build messages array for API
      const apiMessages = isRegenerate 
        ? messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
        : [...messages, userMessage].filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));

      // Call AI assistant edge function
      const response = await fetch(
        `https://dmmmwrqtbwtmqtvoxdxc.supabase.co/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            conversationId: currentConvId,
            context
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 402) {
          throw new Error(errorData.message || 'Please add credits to your Lovable AI workspace to continue using the AI Assistant.');
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
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

        // Update conversation timestamp
        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConvId);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the request
        toast({
          title: 'Cancelled',
          description: 'Response generation was cancelled',
        });
      } else {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to send message',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, messages, context, createConversation, generateTitle, toast]);

  // Regenerate last response
  const regenerateResponse = useCallback(async () => {
    if (messages.length < 2) return;
    
    // Find the last user message (iterate backwards)
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;
    
    const userMessage = messages[lastUserMessageIndex];
    
    // Remove the last assistant message from UI
    setMessages(prev => prev.slice(0, -1));
    
    // Delete last assistant message from database
    const lastAssistantMessage = messages[messages.length - 1];
    if (lastAssistantMessage && lastAssistantMessage.role === 'assistant') {
      await supabase
        .from('ai_messages')
        .delete()
        .eq('id', lastAssistantMessage.id);
    }
    
    // Resend the user message
    await sendMessage(userMessage.content, true);
  }, [messages, sendMessage]);

  // Delete conversation
  const deleteConversation = useCallback(async (convId: string) => {
    try {
      // Delete all messages first
      await supabase.from('ai_messages').delete().eq('conversation_id', convId);
      // Delete conversation
      await supabase.from('ai_conversations').delete().eq('id', convId);
      
      if (conversationId === convId) {
        setMessages([]);
        setConversationId(undefined);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }, [conversationId]);

  // Rename conversation
  const renameConversation = useCallback(async (convId: string, newTitle: string) => {
    try {
      await supabase
        .from('ai_conversations')
        .update({ conversation_title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', convId);
      return true;
    } catch (error) {
      console.error('Error renaming conversation:', error);
      return false;
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    conversationId,
    sendMessage,
    loadConversation,
    clearConversation,
    cancelStream,
    regenerateResponse,
    deleteConversation,
    renameConversation
  };
}
