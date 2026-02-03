import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, Copy, Check, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  isLast?: boolean;
  isLoading?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRegenerate,
  isLast = false,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      className={cn(
        'group flex gap-3 items-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative px-4 py-2.5 max-w-[85%] md:max-w-[75%] shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
              : 'bg-muted rounded-2xl rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;
                    
                    if (isInline) {
                      return (
                        <code
                          className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="relative my-3 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 text-xs text-zinc-400">
                          <span>{match?.[1] || 'code'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-zinc-700"
                            onClick={async () => {
                              await navigator.clipboard.writeText(String(children));
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match?.[1] || 'text'}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            fontSize: '0.875rem',
                          }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full border-collapse border border-border text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border bg-muted px-3 py-1.5 text-left font-medium">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-1.5">{children}</td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions and timestamp row */}
        <div
          className={cn(
            'flex items-center gap-2 px-1 transition-opacity duration-200',
            showActions ? 'opacity-100' : 'opacity-0'
          )}
        >
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(message.created_at)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {new Date(message.created_at).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied!' : 'Copy message'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isUser && isLast && onRegenerate && !isLoading && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate response</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-0.5">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};
