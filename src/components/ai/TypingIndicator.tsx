import React from 'react';
import { Sparkles } from 'lucide-react';

export const TypingIndicator: React.FC = () => (
  <div className="flex gap-3 items-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
      <Sparkles className="h-4 w-4 text-primary" />
    </div>
    <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);
