-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create ai_conversations table
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_title TEXT,
  context_type TEXT CHECK (context_type IN ('inventory', 'orders', 'warehouse', 'products', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_messages table
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  reasoning_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_actions table
CREATE TABLE public.ai_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'query')),
  table_name TEXT NOT NULL,
  action_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations"
  ON public.ai_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.ai_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON public.ai_conversations FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for ai_messages
CREATE POLICY "Users can view messages in own conversations"
  ON public.ai_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON public.ai_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_actions
CREATE POLICY "Users can view own actions"
  ON public.ai_actions FOR SELECT
  USING (
    message_id IN (
      SELECT m.id FROM public.ai_messages m
      JOIN public.ai_conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pending actions"
  ON public.ai_actions FOR UPDATE
  USING (
    message_id IN (
      SELECT m.id FROM public.ai_messages m
      JOIN public.ai_conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Create indexes for better performance
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_company_id ON public.ai_conversations(company_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_actions_message_id ON public.ai_actions(message_id);
CREATE INDEX idx_ai_actions_status ON public.ai_actions(status);

-- Create trigger for updating updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();