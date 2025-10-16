import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Warehouse,
  CheckCircle,
  X,
  Package,
  FileText,
  Upload,
} from 'lucide-react';
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadContractDocument } from '@/utils/fileUpload';

interface Product {
  name: string;
  variants: Array<{
    attribute: string;
    values: Array<{ value: string; quantity: number }>;
  }>;
  quantity: number;
}

const clientSchema = z.object({
  client_code: z.string().min(1, 'Client code is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_email: z.string().email('Valid email required').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  billing_address: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  contract_document_url: z.string().optional(),
  is_active: z.boolean(),
  location_type: z.enum(['floor_zone', 'shelf_row']).optional(),
  assigned_floor_zone_id: z.string().optional(),
  assigned_row_id: z.string().optional(),
}).refine((data) => {
  if (data.location_type === 'floor_zone' && !data.assigned_floor_zone_id) {
    return false;
  }
  if (data.location_type === 'shelf_row' && !data.assigned_row_id) {
    return false;
  }
  return true;
}, {
  message: "Please select a location",
  path: ["location_type"],
}).refine((data) => {
  // If contract end date is provided, it must be after start date
  if (data.contract_start_date && data.contract_end_date) {
    return new Date(data.contract_end_date) > new Date(data.contract_start_date);
  }
  return true;
}, {
  message: "Contract end date must be after start date",
  path: ["contract_end_date"],
});

type ClientFormData = z.infer<typeof clientSchema>;

interface MultiStepClientFormProps {
  client?: Client | null;
  onSubmit: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Company Information',
    description: 'Basic company details',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Warehouse Location',
    description: 'Assign warehouse zone or shelf',
    icon: Warehouse,
  },
  {
    id: 3,
    title: 'Products',
    description: 'Add client products',
    icon: Package,
  },
  {
    id: 4,
    title: 'Contract Details',
    description: 'Contract information',
    icon: FileText,
  },
  {
    id: 5,
    title: 'Review & Confirm',
    description: 'Review all information',
    icon: CheckCircle,
  },
];

export const MultiStepClientForm: React.FC<MultiStepClientFormProps> = ({ 
  client, 
  onSubmit, 
  onCancel 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [floorZones, setFloorZones] = useState<any[]>([]);
  const [shelfRows, setShelfRows] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const onInvalid = (errors: any) => {
    console.error('Form invalid on submit:', errors);
    const firstKey = Object.keys(errors)[0];
    const message = firstKey ? (errors as any)[firstKey]?.message || 'Please check highlighted fields' : 'Please check highlighted fields';
    toast({
      title: 'Fix errors to continue',
      description: String(message),
      variant: 'destructive',
    });
  };
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      client_code: client.client_code || '',
      company_name: client.company_name || '',
      contact_email: client.email || '',
      contact_phone: client.phone || '',
      address: client.address || '',
      billing_address: client.billing_address || '',
      contract_start_date: client.contract_start_date || '',
      contract_end_date: client.contract_end_date || '',
      is_active: client.is_active,
      location_type: client.location_type || undefined,
      assigned_floor_zone_id: client.assigned_floor_zone_id || undefined,
      assigned_row_id: client.assigned_row_id || undefined,
    } : {
      client_code: '',
      company_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      billing_address: '',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchWarehouseLocations();
    if (!client) {
      generateClientCode();
    }
  }, []);

  const generateClientCode = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_client_code');
      if (error) throw error;
      if (data) {
        form.setValue('client_code', data);
      }
    } catch (error) {
      console.error('Error generating client code:', error);
    }
  };

  const fetchWarehouseLocations = async () => {
    try {
      // Fetch floor zones
      const { data: zones, error: zonesError } = await supabase
        .from('warehouse_zones')
        .select('*')
        .eq('zone_type', 'floor')
        .eq('is_active', true)
        .order('code');

      if (zonesError) throw zonesError;

      // Fetch shelf rows
      const { data: rows, error: rowsError } = await supabase
        .from('warehouse_rows')
        .select('*')
        .eq('is_active', true)
        .order('row_number');

      if (rowsError) throw rowsError;

      setFloorZones(zones || []);
      setShelfRows(rows || []);
    } catch (error) {
      console.error('Error fetching warehouse locations:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouse locations",
        variant: "destructive",
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    console.log('Validating step', currentStep, 'fields:', fieldsToValidate);
    const isStepValid = await form.trigger(fieldsToValidate);
    console.log('Step validation result:', isStepValid, 'Errors:', form.formState.errors);
    
    if (isStepValid) {
      let nextStepNumber = currentStep + 1;
      
      // Skip products step when editing (products managed separately)
      if (client && nextStepNumber === 3) {
        nextStepNumber = 4;
      }
      
      if (nextStepNumber <= steps.length) {
        console.log('Moving to step', nextStepNumber);
        setCurrentStep(nextStepNumber);
      }
    } else {
      console.log('Validation failed for step', currentStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      let prevStepNumber = currentStep - 1;
      
      // Skip products step when editing (products managed separately)
      if (client && prevStepNumber === 3) {
        prevStepNumber = 2;
      }
      
      setCurrentStep(prevStepNumber);
    }
  };

  const getFieldsForStep = (step: number): (keyof ClientFormData)[] => {
    switch (step) {
      case 1:
        return ['client_code', 'company_name'];
      case 2:
        const lt = form.getValues('location_type');
        if (lt === 'floor_zone') return ['location_type', 'assigned_floor_zone_id'];
        if (lt === 'shelf_row') return ['location_type', 'assigned_row_id'];
        return [];
      case 3:
        return []; // Products are optional
      case 4:
        return ['contract_start_date', 'contract_end_date']; // Validate dates if provided
      default:
        return [];
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    console.log('Form submit triggered', { data, client, currentStep });
    setIsUploading(true);
    
    try {
      let contractDocUrl = data.contract_document_url;
      
      // Upload contract document if a new file is provided
      if (contractFile) {
        console.log('Uploading contract file...');
        // Use client ID if editing, otherwise generate temp ID
        const folderId = client?.id || crypto.randomUUID();
        const uploadResult = await uploadContractDocument(contractFile, folderId);
        
        if (!uploadResult.success) {
          toast({
            title: "Upload Error",
            description: uploadResult.error || "Failed to upload contract document",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }
        
        contractDocUrl = uploadResult.url;
      }
      
      // Prepare submission data
      const submissionData: any = {
        ...data,
        contact_name: data.contact_email || '',
        email: data.contact_email || '',
        phone: data.contact_phone || '',
        contract_document_url: contractDocUrl,
      };
      
      // Ensure only the relevant assignment is set
      if (submissionData.location_type === 'floor_zone') {
        submissionData.assigned_row_id = null;
      } else if (submissionData.location_type === 'shelf_row') {
        submissionData.assigned_floor_zone_id = null;
      }
      
      // Only include products when creating a new client
      if (!client && products.length > 0) {
        submissionData.initial_products = products;
      }
      
      console.log('Submitting client data:', submissionData);
      onSubmit(submissionData);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formData = form.getValues();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {client ? 'Edit Client' : 'Add New Client'}
            </h1>
            <p className="text-muted-foreground">
              {client ? 'Update client information' : 'Create a new client account'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="relative">
            <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-muted">
              <div 
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-out"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/10'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? 'bg-primary text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isCurrent ? 'text-primary' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CLI-00001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Company Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@company.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1 (555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main St" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Warehouse Location */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Location Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="location_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Location Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) => {
                            // Clear previous assignment when switching type
                            if (val === 'floor_zone') {
                              form.setValue('assigned_row_id', undefined);
                            } else if (val === 'shelf_row') {
                              form.setValue('assigned_floor_zone_id', undefined);
                            }
                            field.onChange(val);
                          }}
                          value={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value="floor_zone" id="floor" />
                            <label htmlFor="floor" className="flex-1 cursor-pointer">
                              <div className="font-medium">Dedicated Floor Zone</div>
                              <div className="text-sm text-muted-foreground">
                                Exclusive warehouse zone
                              </div>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value="shelf_row" id="shelf" />
                            <label htmlFor="shelf" className="flex-1 cursor-pointer">
                              <div className="font-medium">Shared Shelf Row</div>
                              <div className="text-sm text-muted-foreground">
                                Assigned shelf row
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('location_type') === 'floor_zone' && (
                  <FormField
                    control={form.control}
                    name="assigned_floor_zone_id"
                    render={({ field }) => {
                      console.log('Floor zone field value:', field.value);
                      return (
                        <FormItem>
                          <FormLabel>Select Floor Zone</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              console.log('Floor zone selected:', value);
                              field.onChange(value);
                            }} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a floor zone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-50 bg-popover">
                              {floorZones.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  {zone.code} - {zone.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                {form.watch('location_type') === 'shelf_row' && (
                  <FormField
                    control={form.control}
                    name="assigned_row_id"
                    render={({ field }) => {
                      console.log('Shelf row field value:', field.value);
                      return (
                        <FormItem>
                          <FormLabel>Select Shelf Row</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              console.log('Shelf row selected:', value);
                              field.onChange(value);
                            }} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a shelf row" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-50 bg-popover">
                              {shelfRows.map((row) => (
                                <SelectItem key={row.id} value={row.id}>
                                  {row.code} - Row {row.row_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Products */}
          {currentStep === 3 && !client && (
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Product {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setProducts(products.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Product Name</label>
                        <Input
                          value={product.name}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[index].name = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Total Quantity
                          {product.variants.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">(Auto-calculated)</span>
                          )}
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={
                            product.variants.length > 0
                              ? product.variants.reduce((sum, v) => 
                                  sum + v.values.reduce((s, val) => s + val.quantity, 0), 0)
                              : product.quantity
                          }
                          onChange={(e) => {
                            const updated = [...products];
                            updated[index].quantity = parseInt(e.target.value) || 0;
                            setProducts(updated);
                          }}
                          disabled={product.variants.length > 0}
                          className={product.variants.length > 0 ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Variants</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = [...products];
                              updated[index].variants.push({ attribute: '', values: [{ value: '', quantity: 0 }] });
                              setProducts(updated);
                            }}
                          >
                            Add Variant
                          </Button>
                        </div>

                        {product.variants.map((variant, vIdx) => (
                          <div key={vIdx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <Input
                                value={variant.attribute}
                                onChange={(e) => {
                                  const updated = [...products];
                                  updated[index].variants[vIdx].attribute = e.target.value;
                                  setProducts(updated);
                                }}
                                placeholder="Attribute (Color, Size)"
                                className="flex-1 mr-2"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updated = [...products];
                                  updated[index].variants = updated[index].variants.filter((_, i) => i !== vIdx);
                                  setProducts(updated);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {variant.values.map((val, valIdx) => (
                              <div key={valIdx} className="flex gap-2 items-center pl-3">
                                <Input
                                  value={val.value}
                                  onChange={(e) => {
                                    const updated = [...products];
                                    updated[index].variants[vIdx].values[valIdx].value = e.target.value;
                                    setProducts(updated);
                                  }}
                                  placeholder="Value (Red, Large)"
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={val.quantity}
                                  onChange={(e) => {
                                    const updated = [...products];
                                    updated[index].variants[vIdx].values[valIdx].quantity = parseInt(e.target.value) || 0;
                                    setProducts(updated);
                                  }}
                                  placeholder="Qty"
                                  className="w-24"
                                />
                                {variant.values.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...products];
                                      updated[index].variants[vIdx].values = 
                                        updated[index].variants[vIdx].values.filter((_, i) => i !== valIdx);
                                      setProducts(updated);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = [...products];
                                updated[index].variants[vIdx].values.push({ value: '', quantity: 0 });
                                setProducts(updated);
                              }}
                              className="w-full ml-3"
                            >
                              + Add Value
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {products.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No products added yet</p>
                      <p className="text-sm">Products can be added later if needed</p>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProducts([...products, { name: '', variants: [], quantity: 0 }])}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Contract Details */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contract_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Start Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contract_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract End Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter billing address (defaults to company address)" rows={3} />
                      </FormControl>
                      <FormDescription>
                        Leave empty to use company address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="text-sm font-medium mb-2 block">Contract Document (PDF)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file
                          if (file.type !== 'application/pdf') {
                            toast({
                              title: "Invalid File",
                              description: "Only PDF files are allowed",
                              variant: "destructive",
                            });
                            e.target.value = '';
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            toast({
                              title: "File Too Large",
                              description: "File must be less than 10MB",
                              variant: "destructive",
                            });
                            e.target.value = '';
                            return;
                          }
                          setContractFile(file);
                        }
                      }}
                    />
                    {contractFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setContractFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {contractFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {contractFile.name} ({(contractFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Max file size: 10MB, PDF only
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Company Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client Code:</span>
                      <p className="font-medium">{formData.client_code}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company Name:</span>
                      <p className="font-medium">{formData.company_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{formData.contact_email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{formData.contact_phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium">{formData.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {formData.location_type && (
                  <div>
                    <h3 className="font-semibold mb-3">Warehouse Assignment</h3>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Location Type:</span>
                      <Badge className="ml-2">
                        {formData.location_type === 'floor_zone' ? 'Dedicated Floor Zone' : 'Shared Shelf Row'}
                      </Badge>
                    </div>
                  </div>
                )}

                {!client && products.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Products ({products.length})</h3>
                    <div className="space-y-2">
                      {products.map((product, idx) => (
                        <div key={idx} className="border rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{product.name || `Product ${idx + 1}`}</span>
                            <Badge variant="secondary">
                              Qty: {product.variants.length > 0 
                                ? product.variants.reduce((sum, v) => sum + v.values.reduce((s, val) => s + val.quantity, 0), 0)
                                : product.quantity}
                            </Badge>
                          </div>
                          {product.variants.length > 0 && (
                            <div className="pl-3 space-y-1 text-xs text-muted-foreground">
                              {product.variants.map((variant, vIdx) => (
                                <div key={vIdx}>
                                  <span className="font-medium">{variant.attribute}:</span>{' '}
                                  {variant.values.map(v => `${v.value} (${v.quantity})`).join(', ')}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.contract_start_date || formData.contract_end_date || contractFile || formData.billing_address) && (
                  <div>
                    <h3 className="font-semibold mb-3">Contract Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {formData.contract_start_date && (
                        <div>
                          <span className="text-muted-foreground">Start Date:</span>
                          <p className="font-medium">{new Date(formData.contract_start_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {formData.contract_end_date && (
                        <div>
                          <span className="text-muted-foreground">End Date:</span>
                          <p className="font-medium">{new Date(formData.contract_end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {formData.billing_address && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Billing Address:</span>
                          <p className="font-medium">{formData.billing_address}</p>
                        </div>
                      )}
                      {contractFile && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Contract Document:</span>
                          <p className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {contractFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Uploading...' : client ? 'Update Client' : 'Create Client'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};