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
  FileText,
  Upload,
} from 'lucide-react';
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadContractDocument, getContractDocumentUrl } from '@/utils/fileUpload';

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
  // Client Portal Credentials (optional)
  create_portal_access: z.boolean().default(false),
  client_user_email: z.string().email('Valid email required').optional().or(z.literal('')),
  client_user_password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
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
}).refine((data) => {
  // If create_portal_access is true, email and password must be provided
  if (data.create_portal_access) {
    return data.client_user_email && data.client_user_password;
  }
  return true;
}, {
  message: "Email and password are required for portal access",
  path: ["client_user_email"],
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
    title: 'Contract Details',
    description: 'Contract information',
    icon: FileText,
  },
  {
    id: 4,
    title: 'Portal Access',
    description: 'Client portal credentials (optional)',
    icon: Building2,
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
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [existingContractUrl, setExistingContractUrl] = useState<string | null>(null);
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
      contract_document_url: (client as any).contract_document_url || '',
      is_active: client.is_active,
      location_type: client.location_type || undefined,
      assigned_floor_zone_id: client.assigned_floor_zone_id || undefined,
      create_portal_access: false,
      client_user_email: '',
      client_user_password: '',
      assigned_row_id: client.assigned_row_id || undefined,
    } : {
      client_code: '',
      company_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      billing_address: '',
      is_active: true,
      create_portal_access: false,
      client_user_email: '',
      client_user_password: '',
    },
  });

  useEffect(() => {
    fetchWarehouseLocations();
    if (!client) {
      generateClientCode();
    } else {
      // Set existing contract URL when editing
      const contractUrl = (client as any).contract_document_url;
      if (contractUrl) {
        setExistingContractUrl(contractUrl);
      }
    }
  }, [client]);

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
      const nextStepNumber = currentStep + 1;
      
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
      setCurrentStep(currentStep - 1);
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
        return ['contract_start_date', 'contract_end_date']; // Validate dates if provided
      case 4:
        const createPortal = form.getValues('create_portal_access');
        if (createPortal) return ['client_user_email', 'client_user_password'];
        return [];
      default:
        return [];
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    // Guard: prevent accidental submissions before final step
    if (currentStep !== steps.length) {
      return;
    }

    setIsUploading(true);
    
    try {
      let contractDocUrl = existingContractUrl || data.contract_document_url;
      
      // Upload contract document if a new file is provided
      if (contractFile) {
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
              const canNavigate = isCompleted || isCurrent;
              
              return (
                <div
                  key={step.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (canNavigate) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/10'
                      : isCompleted
                      ? 'border-green-500 bg-green-50 cursor-pointer hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
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
        <form 
          onSubmit={form.handleSubmit(handleSubmit, onInvalid)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && currentStep !== steps.length) {
              e.preventDefault();
            }
          }}
          className="space-y-6"
        >
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

          {/* Step 3: Contract Details */}
          {currentStep === 3 && (
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
                  
                  {existingContractUrl && !contractFile && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-900 font-medium">Contract document uploaded</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const { data, error } = await supabase.storage
                                .from('contract-documents')
                                .createSignedUrl(existingContractUrl, 3600);
                              
                              if (error || !data?.signedUrl) {
                                toast({
                                  title: "Error",
                                  description: "Failed to generate contract URL",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              window.open(data.signedUrl, '_blank');
                            }}
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExistingContractUrl(null)}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(!existingContractUrl || contractFile) && (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Portal Access */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Client Portal Access (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="create_portal_access"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create client portal login credentials
                          </FormLabel>
                          <FormDescription>
                            Allow this client to access their own portal dashboard with the credentials below
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch('create_portal_access') && (
                    <>
                      <FormField
                        control={form.control}
                        name="client_user_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portal Email *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="client@company.com"
                              />
                            </FormControl>
                            <FormDescription>
                              Email address for client portal login
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="client_user_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portal Password *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Minimum 8 characters"
                              />
                            </FormControl>
                            <FormDescription>
                              Password for client portal access (min. 8 characters)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-blue-900">
                          ℹ️ The client will be able to login at <strong>/client/login</strong> with these credentials to view their inventory, orders, and products.
                        </p>
                      </div>
                    </>
                  )}

                  {!form.watch('create_portal_access') && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        You can skip this step and create portal access later from the client management page.
                      </p>
                    </div>
                  )}
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