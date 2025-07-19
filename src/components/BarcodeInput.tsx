import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine } from 'lucide-react';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

// Sample barcodes for simulation
const sampleBarcodes = [
  'WH001',
  'MUG001', 
  'KB001',
  'PEN001',
  '1234567890123',
  '9876543210987',
];

export const BarcodeInput: React.FC<BarcodeInputProps> = ({
  value,
  onChange,
  placeholder = "Scan or enter barcode",
  label = "Barcode",
  disabled = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const simulateScan = () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
      onChange(randomBarcode);
      setIsScanning(false);
    }, 1000);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="barcode">{label}</Label>
      <div className="flex gap-2">
        <Input
          id="barcode"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isScanning}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={simulateScan}
          disabled={disabled || isScanning}
          className="shrink-0"
        >
          <ScanLine className="h-4 w-4 mr-2" />
          {isScanning ? 'Scanning...' : 'Scan'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click "Scan" to simulate barcode scanning or type manually
      </p>
    </div>
  );
};