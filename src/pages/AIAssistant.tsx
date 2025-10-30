import React from 'react';
import { AIChat } from '@/components/ai/AIChat';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AIAssistant() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Assistant</h1>
            <p className="text-muted-foreground">
              Get intelligent insights and recommendations for your warehouse operations
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <AIChat context="general" />
      </Card>
    </div>
  );
}