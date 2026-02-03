import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Square, Sparkles, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface AIChatProps {
  context?: 'inventory' | 'orders' | 'warehouse' | 'products' | 'general';
  conversationId?: string;
  onConversationCreated?: () => void;
  userRole?: 'admin' | 'b2b_client' | 'b2c_client';
}

export const AIChat: React.FC<AIChatProps> = ({
  context = 'general',
  conversationId,
  onConversationCreated,
  userRole = 'admin',
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, isStreaming, sendMessage, cancelStream, regenerateResponse } =
    useAIChat({
      conversationId,
      context,
    });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageText = input;
    setInput('');
    await sendMessage(messageText);

    if (onConversationCreated) {
      onConversationCreated();
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const quickActions = useMemo(() => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'Show warehouse utilization', icon: '📊' },
          { label: 'List all low stock items', icon: '📦' },
          { label: 'Generate monthly report', icon: '📈' },
          { label: 'Check pending requests', icon: '📋' },
        ];
      case 'b2b_client':
        return [
          { label: 'Check my inventory levels', icon: '📦' },
          { label: 'Track my orders', icon: '🚚' },
          { label: 'View storage usage', icon: '📊' },
          { label: 'Request product checkout', icon: '📤' },
        ];
      case 'b2c_client':
        return [
          { label: 'View my products', icon: '📦' },
          { label: 'Check order status', icon: '🔍' },
          { label: 'Request checkout', icon: '📤' },
          { label: 'Ask about storage', icon: '💬' },
        ];
      default:
        return [
          { label: 'Show low stock items', icon: '📦' },
          { label: 'Analyze warehouse utilization', icon: '📊' },
          { label: 'Recent order summary', icon: '📋' },
          { label: 'Product performance report', icon: '📈' },
        ];
    }
  }, [userRole]);

  const characterCount = input.length;
  const maxCharacters = 4000;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 md:px-6 py-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 md:py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{getGreeting()}</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                I'm your AI assistant. Ask me anything about your warehouse operations, inventory,
                orders, or reports.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-3 px-4 text-left hover:bg-accent group transition-colors"
                    onClick={() => {
                      setInput(action.label);
                      textareaRef.current?.focus();
                    }}
                  >
                    <span className="mr-2 text-lg">{action.icon}</span>
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRegenerate={
                message.role === 'assistant' && index === messages.length - 1
                  ? regenerateResponse
                  : undefined
              }
              isLast={index === messages.length - 1}
              isLoading={isLoading}
            />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur-sm p-3 md:p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant..."
                className={cn(
                  'min-h-[48px] max-h-[150px] resize-none pr-20 py-3',
                  'focus-visible:ring-1 focus-visible:ring-primary'
                )}
                disabled={isLoading}
                rows={1}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs transition-colors',
                    characterCount > maxCharacters * 0.9
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {characterCount > 0 && `${characterCount}/${maxCharacters}`}
                </span>
              </div>
            </div>

            {isLoading || isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-12 w-12 flex-shrink-0"
                onClick={cancelStream}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                disabled={!input.trim() || characterCount > maxCharacters}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" />
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to send,{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Shift+Enter</kbd> for new
              line
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
