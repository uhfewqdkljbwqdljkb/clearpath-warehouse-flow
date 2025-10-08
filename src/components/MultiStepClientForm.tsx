import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  FileText, 
  CheckCircle,
  X,
  Package,
  Warehouse,
  Upload,
  File
} from 'lucide-react';
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const variantValueSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

const productVariantSchema = z.object({
  attribute: z.string().min(1, 'Attribute name is required'),
  values: z.array(variantValueSchema).min(1, 'At least one value is required'),
});

const initialProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  variants: z.array(productVariantSchema).optional(),
  quantity: z.number().min(0, 'Quantity must be at least 0').optional(),
});

const clientSchema = z.object({
  client_code: z.string().min(1, 'Client code is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  billing_address: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  storage_plan: z.string().optional(),
  max_storage_cubic_feet: z.number().optional(),
  monthly_fee: z.number().optional(),
  is_active: z.boolean(),
  location_type: z.enum(['floor_zone', 'shelf_row'], { required_error: 'Location type is required' }),
  assigned_floor_zone_id: z.string().optional(),
  assigned_row_id: z.string().optional(),
  contract_document_url: z.string().optional(),
  initial_products: z.array(initialProductSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.location_type === 'floor_zone' && !data.assigned_floor_zone_id) {
    ctx.addIssue({ code: 'custom', path: ['assigned_floor_zone_id'], message: 'Please select a floor zone' });
  }
  if (data.location_type === 'shelf_row' && !data.assigned_row_id) {
    ctx.addIssue({ code: 'custom', path: ['assigned_row_id'], message: 'Please select a shelf row' });
  }
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
    title: 'Contract Document',
    description: 'Upload client contract',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Warehouse Location',
    description: 'Assign warehouse zone or shelf',
    icon: Warehouse,
  },
  {
    id: 4,
    title: 'Add Initial Products',
    description: 'Add products and variants',
    icon: Package,
  },
  {
    id: 5,
    title: 'Review & Confirm',
    description: 'Review all information before submitting',
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<Array<{name: string, variants: Array<{attribute: string, values: Array<{value: string, quantity: number}>}>, quantity?: number}>>([]);
  const { toast } = useToast();
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      client_code: client.client_code,
      company_name: client.company_name,
      contact_name: client.contact_name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      billing_address: client.billing_address,
      contract_start_date: client.contract_start_date,
      contract_end_date: client.contract_end_date,
      storage_plan: client.storage_plan,
      max_storage_cubic_feet: client.max_storage_cubic_feet,
      monthly_fee: client.monthly_fee,
      is_active: client.is_active,
      location_type: (client as any).location_type,
      assigned_floor_zone_id: (client as any).assigned_floor_zone_id,
      assigned_row_id: (client as any).assigned_row_id,
      contract_document_url: (client as any).contract_document_url,
      initial_products: [],
    } : {
      client_code: '',
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      billing_address: '',
      contract_start_date: '',
      contract_end_date: '',
      storage_plan: 'basic',
      max_storage_cubic_feet: 1000,
      monthly_fee: 0,
      is_active: true,
      location_type: undefined,
      assigned_floor_zone_id: undefined,
      assigned_row_id: undefined,
      contract_document_url: undefined,
      initial_products: [],
    },
  });

  useEffect(() => {
    fetchWarehouseLocations();
  }, []);

  // Auto-generate client code if missing for existing clients
  useEffect(() => {
    const generateClientCode = async () => {
      if (client && !form.getValues('client_code')) {
        try {
          const { data, error } = await supabase.rpc('generate_client_code');
          if (error) throw error;
          if (data) {
            form.setValue('client_code', data);
            toast({
              title: "Client code generated",
              description: `Auto-generated code: ${data}`,
            });
          }
        } catch (error) {
          console.error('Error generating client code:', error);
        }
      }
    };
    
    generateClientCode();
  }, [client]);

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

      // Fetch shelf zone and rows
      const { data: shelfZone, error: shelfError } = await supabase
        .from('warehouse_zones')
        .select('id')
        .eq('zone_type', 'shelf')
        .eq('code', 'Z')
        .single();

      if (shelfError) throw shelfError;

      const { data: rows, error: rowsError } = await supabase
        .from('warehouse_rows')
        .select('*')
        .eq('zone_id', shelfZone.id)
        .eq('is_occupied', false)
        .order('row_number');

      if (rowsError) throw rowsError;

      setFloorZones(zones || []);
      setShelfRows(rows || []);
    } catch (error) {
      console.error('Error fetching warehouse locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await form.trigger(fieldsToValidate);
    
    if (isStepValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

const getFieldsForStep = (step: number): (keyof ClientFormData)[] => {
  switch (step) {
    case 1:
      return ['client_code', 'company_name'];
    case 2:
      return []; // File upload doesn't need form validation
    case 3: {
      const lt = form.getValues('location_type');
      if (lt === 'floor_zone') return ['location_type', 'assigned_floor_zone_id'];
      if (lt === 'shelf_row') return ['location_type', 'assigned_row_id'];
      return ['location_type'];
    }
    case 4:
      return []; // Products are optional
    case 5:
      return ['is_active'];
    default:
      return [];
  }
};

  const addProduct = () => {
    setProducts([...products, { name: '', variants: [], quantity: 0 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const addVariant = (productIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants.push({ attribute: '', values: [{ value: '', quantity: 0 }] });
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const addValueToVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex].values.push({ value: '', quantity: 0 });
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const removeValueFromVariant = (productIndex: number, variantIndex: number, valueIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex].values = 
      updated[productIndex].variants[variantIndex].values.filter((_, i) => i !== valueIndex);
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const updateVariantValue = (productIndex: number, variantIndex: number, valueIndex: number, field: string, value: any) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex].values[valueIndex] = {
      ...updated[productIndex].variants[variantIndex].values[valueIndex],
      [field]: value
    };
    
    // Auto-update total quantity
    if (updated[productIndex].variants.length > 0) {
      const totalQty = updated[productIndex].variants.reduce((sum, variant) => 
        sum + variant.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
      );
      updated[productIndex].quantity = totalQty;
    }
    
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const calculateTotalQuantity = (productIndex: number) => {
    const product = products[productIndex];
    if (product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => 
        sum + variant.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
      );
    }
    return product.quantity || 0;
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants = updated[productIndex].variants.filter((_, i) => i !== variantIndex);
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const updateVariant = (productIndex: number, variantIndex: number, field: string, value: any) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex] = {
      ...updated[productIndex].variants[variantIndex],
      [field]: value
    };
    setProducts(updated);
    form.setValue('initial_products', updated);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${form.getValues('client_code')}-${Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-contracts')
        .getPublicUrl(filePath);

      setUploadedFile(file);
      setUploadedFileUrl(filePath);
      form.setValue('contract_document_url', filePath);

      toast({
        title: "Success",
        description: "Contract document uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload contract document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (data: ClientFormData) => {
    onSubmit(data as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
  };

  const handleInvalidSubmit = (errors: any) => {
    console.warn('Form validation errors:', errors);
    
    // Map fields to their respective steps
    const fieldStepMap: Record<string, number> = {
      client_code: 1,
      company_name: 1,
      contact_name: 1,
      email: 1,
      phone: 1,
      address: 1,
      billing_address: 1,
      contract_start_date: 1,
      contract_end_date: 1,
      storage_plan: 1,
      max_storage_cubic_feet: 1,
      monthly_fee: 1,
      contract_document_url: 2,
      location_type: 3,
      assigned_floor_zone_id: 3,
      assigned_row_id: 3,
      initial_products: 4,
      is_active: 5,
    };

    // Find the first invalid field and its step
    const invalidFields = Object.keys(errors);
    if (invalidFields.length > 0) {
      const firstInvalidField = invalidFields[0];
      const targetStep = fieldStepMap[firstInvalidField] || 1;
      
      setCurrentStep(targetStep);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields in Step ${targetStep}: ${steps[targetStep - 1].title}`,
        variant: "destructive",
      });
    }
  };

  const getStoragePlanDetails = (plan: string) => {
    switch (plan) {
      case 'basic':
        return { color: 'bg-blue-100 text-blue-800', features: ['Standard security', 'Basic reporting', 'Email support'] };
      case 'premium':
        return { color: 'bg-purple-100 text-purple-800', features: ['Enhanced security', 'Advanced reporting', 'Priority support', 'API access'] };
      case 'enterprise':
        return { color: 'bg-green-100 text-green-800', features: ['Maximum security', 'Custom reporting', '24/7 support', 'Full API access', 'Dedicated manager'] };
      default:
        return { color: 'bg-gray-100 text-gray-800', features: [] };
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
          {/* Progress Bar */}
          <div className="relative">
            <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-muted">
              <div 
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-out"
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isCompleted ? setCurrentStep(step.id) : null}
                  disabled={!isCompleted && !isActive}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-green-50 border-green-500 hover:bg-green-100 cursor-pointer' 
                      : isActive 
                        ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/20' 
                        : 'bg-background border-muted-foreground/20 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  {/* Step Number Badge */}
                  <div className={`
                    absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>

                  {/* Icon and Text */}
                  <div className="flex flex-col items-center text-center mt-2">
                    <IconComponent className={`
                      h-6 w-6 mb-2
                      ${isCompleted 
                        ? 'text-green-600' 
                        : isActive 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }
                    `} />
                    <p className={`
                      text-sm font-medium line-clamp-2
                      ${isCompleted 
                        ? 'text-green-700' 
                        : isActive 
                          ? 'text-foreground' 
                          : 'text-muted-foreground'
                      }
                    `}>
                      {step.title}
                    </p>
                    {isActive && (
                      <span className="text-xs text-muted-foreground mt-1">Current</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)}>
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Enter the client code and company name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="client_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Client Code
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CLT001" />
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
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Company Name
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ACME Corporation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Contract Document */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Document
                </CardTitle>
                <CardDescription>
                  Upload the client contract document for record keeping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {client?.contract_document_url && !uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Existing contract on file</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Upload a new file to replace the existing contract
                    </p>
                  </div>
                )}
                
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="contract-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="contract-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    {uploadedFile ? (
                      <>
                        <File className="h-16 w-16 text-green-600" />
                        <div>
                          <p className="text-lg font-medium text-green-700">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          Change File
                        </Button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-16 w-16 text-muted-foreground" />
                        <div>
                          <p className="text-lg font-medium">
                            {uploading ? 'Uploading...' : 'Click to upload contract'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PDF, DOC, or DOCX (max 20MB)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 Upload a copy of your internal contract with this client. This document will be stored securely and can be accessed later for reference.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Warehouse Location */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Warehouse Location Assignment
                </CardTitle>
                <CardDescription>
                  Assign this client to a floor zone or shelf row
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingLocations ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading available locations...
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="location_type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Location Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear opposite field when switching types
                                if (value === 'floor_zone') {
                                  form.setValue('assigned_row_id', undefined);
                                } else {
                                  form.setValue('assigned_floor_zone_id', undefined);
                                }
                              }}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="floor_zone" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Floor Zone (Dedicated warehouse floor space)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="shelf_row" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Shelf Row (Zone Z shelving system)
                                </FormLabel>
                              </FormItem>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Floor Zone</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an available floor zone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-50 bg-popover border shadow-lg">
                                {floorZones.map((zone) => (
                                  <SelectItem key={zone.id} value={zone.id}>
                                    <div className="flex items-center gap-2">
                                      <Badge style={{ backgroundColor: zone.color }}>
                                        Zone {zone.code}
                                      </Badge>
                                      <span>{zone.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({zone.total_capacity_cubic_feet?.toLocaleString()} ft³)
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {floorZones.length > 0 
                                ? `${floorZones.length} floor zones available`
                                : 'No floor zones available'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch('location_type') === 'shelf_row' && (
                      <FormField
                        control={form.control}
                        name="assigned_row_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Shelf Row</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an available shelf row" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-50 bg-popover border shadow-lg max-h-[200px]">
                                {shelfRows.map((row) => (
                                  <SelectItem key={row.id} value={row.id}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{row.code}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({row.capacity_cubic_feet} ft³)
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {shelfRows.length > 0 
                                ? `${shelfRows.length} shelf rows available`
                                : 'No shelf rows available'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {!form.watch('location_type') && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          💡 Select a location type to see available options. Floor zones provide dedicated floor space, while shelf rows are part of our shelving system in Zone Z.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Add Initial Products */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add Initial Products
                </CardTitle>
                <CardDescription>
                  Add products with optional variants and quantities (optional step)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {products.map((product, productIndex) => (
                  <div key={productIndex} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Product {productIndex + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(productIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Product Name</label>
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(productIndex, 'name', e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Total Quantity
                          {product.variants.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">(Auto-calculated from variants)</span>
                          )}
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={product.variants.length > 0 ? calculateTotalQuantity(productIndex) : (product.quantity || 0)}
                          onChange={(e) => updateProduct(productIndex, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Enter quantity"
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
                            onClick={() => addVariant(productIndex)}
                          >
                            Add Variant
                          </Button>
                        </div>

                        {product.variants.map((variant, variantIndex) => (
                          <div key={variantIndex} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                  Attribute Name
                                </label>
                                <Input
                                  value={variant.attribute}
                                  onChange={(e) => updateVariant(productIndex, variantIndex, 'attribute', e.target.value)}
                                  placeholder="e.g., Color, Size, Material"
                                  className="font-medium"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariant(productIndex, variantIndex)}
                                className="ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2 pl-3 border-l-2">
                              <label className="text-xs font-medium text-muted-foreground">Values</label>
                              {variant.values.map((val, valueIndex) => (
                                <div key={valueIndex} className="flex gap-2 items-center">
                                  <Input
                                    value={val.value}
                                    onChange={(e) => updateVariantValue(productIndex, variantIndex, valueIndex, 'value', e.target.value)}
                                    placeholder="e.g., Red, Large"
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    value={val.quantity}
                                    onChange={(e) => updateVariantValue(productIndex, variantIndex, valueIndex, 'quantity', parseInt(e.target.value) || 0)}
                                    placeholder="Qty"
                                    className="w-24"
                                  />
                                  {variant.values.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeValueFromVariant(productIndex, variantIndex, valueIndex)}
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
                                onClick={() => addValueToVariant(productIndex, variantIndex)}
                                className="w-full"
                              >
                                + Add Value
                              </Button>
                            </div>
                          </div>
                        ))}

                        {product.variants.length === 0 && (
                          <p className="text-xs text-muted-foreground pl-4">
                            No variants added. Add variants to group values by attribute (e.g., Color with Red, Blue, Green).
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {products.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No products added yet</p>
                    <p className="text-sm">Click "Add Product" to get started</p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addProduct}
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Optional step:</strong> Add initial products now or later. For products with variants, add an attribute (e.g., "Color"), then add multiple values (Red: 5, Blue: 3). Total quantity auto-calculates from all variant values.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Review & Confirm
                </CardTitle>
                <CardDescription>
                  Please review all information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Information Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client Code:</span>
                      <span className="ml-2 font-medium">{formData.client_code}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span>
                      <span className="ml-2 font-medium">{formData.company_name}</span>
                    </div>
                  </div>
                </div>

                {/* Contract Document Summary */}
                {uploadedFile && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contract Document
                    </h3>
                    <div className="flex items-center gap-3 text-sm">
                      <File className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
                        Uploaded
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Warehouse Location Summary */}
                {formData.location_type && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Warehouse Location
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Location Type:</span>
                        <span className="ml-2 font-medium">
                          {formData.location_type === 'floor_zone' ? 'Floor Zone' : 'Shelf Row'}
                        </span>
                      </div>
                      {formData.location_type === 'floor_zone' && formData.assigned_floor_zone_id && (
                        <div>
                          <span className="text-muted-foreground">Assigned Zone:</span>
                          <span className="ml-2 font-medium">
                            {floorZones.find(z => z.id === formData.assigned_floor_zone_id)?.name || 'Selected zone'}
                          </span>
                        </div>
                      )}
                      {formData.location_type === 'shelf_row' && formData.assigned_row_id && (
                        <div>
                          <span className="text-muted-foreground">Assigned Row:</span>
                          <span className="ml-2 font-medium">
                            {shelfRows.find(r => r.id === formData.assigned_row_id)?.code || 'Selected row'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Initial Products Summary */}
                {products.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Initial Products ({products.length})
                    </h3>
                    <div className="space-y-3">
                      {products.map((product, idx) => (
                        <div key={idx} className="text-sm border-l-2 pl-3">
                          <p className="font-medium">{product.name || 'Unnamed Product'}</p>
                          {product.variants.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {product.variants.map((variant, vIdx) => (
                                <div key={vIdx} className="text-xs">
                                  <p className="font-medium text-foreground mb-1">{variant.attribute}:</p>
                                  <div className="pl-3 space-y-1">
                                    {variant.values.map((val, valIdx) => (
                                      <div key={valIdx} className="flex items-center gap-2 text-muted-foreground">
                                        <Badge variant="outline" className="text-xs">
                                          {val.value}
                                        </Badge>
                                        <span>{val.quantity} units</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <div className="pl-3 font-medium text-foreground mt-2 pt-2 border-t">
                                Total: {product.variants.reduce((sum, v) => 
                                  sum + v.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
                                )} units
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground mt-1">Quantity: {product.quantity || 0} units</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Status */}
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable or disable this client account
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {client ? 'Update Client' : 'Create Client'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};