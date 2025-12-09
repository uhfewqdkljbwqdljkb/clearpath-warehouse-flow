import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Variant, getVariantBreakdown, calculateNestedVariantQuantity, hasNestedVariants } from '@/types/variants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface VariantQuantityDisplayProps {
  variants: Variant[];
  showTotal?: boolean;
  compact?: boolean;
}

export const VariantQuantityDisplay: React.FC<VariantQuantityDisplayProps> = ({
  variants,
  showTotal = true,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(!compact);
  
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  const breakdown = getVariantBreakdown(variants);
  const total = calculateNestedVariantQuantity(variants);
  const hasNested = hasNestedVariants(variants);
  const breakdownEntries = Object.entries(breakdown);

  if (breakdownEntries.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span>
            {hasNested ? 'Nested variants' : 'Variants'} ({breakdownEntries.length})
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1 space-y-0.5">
            {breakdownEntries.map(([key, qty]) => (
              <div key={key} className="text-xs text-muted-foreground pl-4">
                {key}: <span className="font-medium">{qty}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-2">
      {showTotal && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Total:</span>
          <Badge variant="secondary">{total}</Badge>
        </div>
      )}
      <div className="space-y-1">
        {breakdownEntries.map(([key, qty]) => (
          <div key={key} className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">{qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantQuantityDisplay;
