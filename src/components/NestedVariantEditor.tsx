import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Variant, VariantValue } from '@/types/variants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NestedVariantEditorProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  maxDepth?: number; // Maximum nesting level (default: 3)
}

export const NestedVariantEditor: React.FC<NestedVariantEditorProps> = ({
  variants,
  onChange,
  maxDepth = 3,
}) => {
  const addVariant = () => {
    onChange([
      ...variants,
      { attribute: '', values: [{ value: '', quantity: 0 }] },
    ]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateValues = (variantIndex: number, newValues: VariantValue[]) => {
    const updated = [...variants];
    updated[variantIndex].values = newValues;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Product Variants</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {variants.length > 0 ? (
        <div className="space-y-4">
          {variants.map((variant, variantIndex) => (
            <VariantCard
              key={variantIndex}
              variant={variant}
              onRemove={() => removeVariant(variantIndex)}
              onAttributeChange={(attr) => updateVariant(variantIndex, 'attribute', attr)}
              onValuesChange={(values) => updateValues(variantIndex, values)}
              depth={0}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground pl-4">
          No variants added. Add variants to track different product options.
        </p>
      )}
    </div>
  );
};

interface VariantCardProps {
  variant: Variant;
  onRemove: () => void;
  onAttributeChange: (attribute: string) => void;
  onValuesChange: (values: VariantValue[]) => void;
  depth: number;
  maxDepth: number;
}

const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  onRemove,
  onAttributeChange,
  onValuesChange,
  depth,
  maxDepth,
}) => {
  const canAddSubVariants = depth < maxDepth - 1;

  const addValue = () => {
    onValuesChange([...variant.values, { value: '', quantity: 0 }]);
  };

  const removeValue = (valueIndex: number) => {
    onValuesChange(variant.values.filter((_, i) => i !== valueIndex));
  };

  const updateValue = (valueIndex: number, updates: Partial<VariantValue>) => {
    const newValues = [...variant.values];
    newValues[valueIndex] = { ...newValues[valueIndex], ...updates };
    onValuesChange(newValues);
  };

  const addSubVariant = (valueIndex: number) => {
    const newValues = [...variant.values];
    const currentSubVariants = newValues[valueIndex].subVariants || [];
    newValues[valueIndex].subVariants = [
      ...currentSubVariants,
      { attribute: '', values: [{ value: '', quantity: 0 }] },
    ];
    // Clear quantity when adding sub-variants (quantity is on leaf nodes only)
    newValues[valueIndex].quantity = 0;
    onValuesChange(newValues);
  };

  const updateSubVariants = (valueIndex: number, newSubVariants: Variant[]) => {
    const newValues = [...variant.values];
    newValues[valueIndex].subVariants = newSubVariants;
    onValuesChange(newValues);
  };

  const removeSubVariant = (valueIndex: number, subVariantIndex: number) => {
    const newValues = [...variant.values];
    newValues[valueIndex].subVariants = newValues[valueIndex].subVariants?.filter(
      (_, i) => i !== subVariantIndex
    );
    onValuesChange(newValues);
  };

  const getDepthColors = () => {
    const colors = [
      'bg-muted/30 border-border',
      'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
      'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
    ];
    return colors[depth] || colors[0];
  };

  return (
    <Card className={`p-4 space-y-3 ${getDepthColors()}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">
            {depth === 0 ? 'Attribute Name' : `Sub-Attribute (Level ${depth + 1})`}
          </Label>
          <Input
            value={variant.attribute}
            onChange={(e) => onAttributeChange(e.target.value)}
            placeholder={depth === 0 ? 'e.g., Size, Color' : 'e.g., Color, Pattern'}
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 pl-3 border-l-2 border-muted-foreground/20">
        <Label className="text-xs text-muted-foreground">Values</Label>
        
        {variant.values.map((val, valueIndex) => (
          <ValueRow
            key={valueIndex}
            value={val}
            onRemove={() => removeValue(valueIndex)}
            onUpdate={(updates) => updateValue(valueIndex, updates)}
            onAddSubVariant={() => addSubVariant(valueIndex)}
            onUpdateSubVariants={(subVariants) => updateSubVariants(valueIndex, subVariants)}
            onRemoveSubVariant={(subIndex) => removeSubVariant(valueIndex, subIndex)}
            canAddSubVariants={canAddSubVariants}
            depth={depth}
            maxDepth={maxDepth}
            showRemove={variant.values.length > 1}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addValue}
          className="w-full"
        >
          + Add Value
        </Button>
      </div>
    </Card>
  );
};

interface ValueRowProps {
  value: VariantValue;
  onRemove: () => void;
  onUpdate: (updates: Partial<VariantValue>) => void;
  onAddSubVariant: () => void;
  onUpdateSubVariants: (subVariants: Variant[]) => void;
  onRemoveSubVariant: (subIndex: number) => void;
  canAddSubVariants: boolean;
  depth: number;
  maxDepth: number;
  showRemove: boolean;
}

const ValueRow: React.FC<ValueRowProps> = ({
  value,
  onRemove,
  onUpdate,
  onAddSubVariant,
  onUpdateSubVariants,
  onRemoveSubVariant,
  canAddSubVariants,
  depth,
  maxDepth,
  showRemove,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasSubVariants = value.subVariants && value.subVariants.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        {hasSubVariants && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 h-auto"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <Input
          value={value.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="e.g., Red, Large"
          className="flex-1"
        />
        
        {!hasSubVariants && (
          <Input
            type="number"
            min="0"
            value={value.quantity}
            onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
            placeholder="Qty"
            className="w-24"
          />
        )}

        {canAddSubVariants && !hasSubVariants && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddSubVariant}
            title="Add sub-variant"
            className="shrink-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}

        {showRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {hasSubVariants && isOpen && (
        <div className="ml-6 space-y-2">
          {value.subVariants!.map((subVariant, subIndex) => (
            <VariantCard
              key={subIndex}
              variant={subVariant}
              onRemove={() => onRemoveSubVariant(subIndex)}
              onAttributeChange={(attr) => {
                const updated = [...value.subVariants!];
                updated[subIndex] = { ...updated[subIndex], attribute: attr };
                onUpdateSubVariants(updated);
              }}
              onValuesChange={(newValues) => {
                const updated = [...value.subVariants!];
                updated[subIndex] = { ...updated[subIndex], values: newValues };
                onUpdateSubVariants(updated);
              }}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
          
          {depth + 1 < maxDepth - 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddSubVariant}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add Sub-Attribute
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default NestedVariantEditor;
