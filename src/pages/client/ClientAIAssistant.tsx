import { AIAssistantLayout } from '@/components/ai/AIAssistantLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientAIAssistant() {
  // Determine if this is a B2B or B2C client based on their company type
  // For now, we'll default to b2b_client since the current system is B2B focused
  // This can be enhanced later when B2C client types are implemented
  
  return (
    <AIAssistantLayout
      userRole="b2b_client"
      title="AI Assistant"
      description="Your warehouse management assistant - manage inventory, track orders, and more"
    />
  );
}
