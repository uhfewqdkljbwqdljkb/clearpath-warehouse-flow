import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  MapPin, 
  FileText, 
  CheckCircle,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
  Warehouse
} from 'lucide-react';
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const clientSchema = z.object({
  client_code: z.string().min(1, 'Client code is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  billing_address: z.string().min(1, 'Billing address is required'),
  contract_start_date: z.string().min(1, 'Contract start date is required'),
  contract_end_date: z.string().min(1, 'Contract end date is required'),
  storage_plan: z.enum(['basic', 'premium', 'enterprise']),
  max_storage_cubic_feet: z.number().min(1, 'Storage capacity must be greater than 0'),
  monthly_fee: z.number().min(0, 'Monthly fee cannot be negative'),
  is_active: z.boolean(),
  location_type: z.enum(['floor_zone', 'shelf_row']).optional(),
  assigned_floor_zone_id: z.string().optional(),
  assigned_row_id: z.string().optional(),
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
    description: 'Basic company and contact details',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Address Details',
    description: 'Physical and billing addresses',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'Contract & Storage',
    description: 'Storage plan and contract terms',
    icon: FileText,
  },
  {
    id: 4,
    title: 'Warehouse Location',
    description: 'Assign warehouse zone or shelf',
    icon: Warehouse,
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
    },
  });

  useEffect(() => {
    fetchWarehouseLocations();
  }, []);

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
        return ['client_code', 'company_name', 'contact_name', 'email', 'phone'];
      case 2:
        return ['address', 'billing_address'];
      case 3:
        return ['contract_start_date', 'contract_end_date', 'storage_plan', 'max_storage_cubic_feet', 'monthly_fee'];
      case 4:
        return ['location_type'];
      case 5:
        return ['is_active'];
      default:
        return [];
    }
  };

  const handleSubmit = (data: ClientFormData) => {
    onSubmit(data as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
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
          <div className="grid grid-cols-4 gap-2">
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
        <form onSubmit={form.handleSubmit(handleSubmit)}>
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

          {/* Step 2: Address Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Provide the physical and billing addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="123 Business Street, City, State 12345" 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="123 Billing Street, City, State 12345" 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 If the billing address is the same as the physical address, you can copy the information above.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Contract & Storage */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract & Storage Details
                </CardTitle>
                <CardDescription>
                  Set up the storage plan and contract terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contract_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Contract Start Date
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Contract End Date
                        </FormLabel>
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
                  name="storage_plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a storage plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-800">Basic</Badge>
                              <span>Standard features</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="premium">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                              <span>Enhanced features + API</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="enterprise">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">Enterprise</Badge>
                              <span>All features + dedicated support</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="max_storage_cubic_feet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Maximum Storage (ft³)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="1000" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthly_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Monthly Fee ($)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="1200" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Warehouse Location */}
          {currentStep === 4 && (
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
                              <SelectContent>
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
                              <SelectContent className="max-h-[200px]">
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
                    <div>
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="ml-2 font-medium">{formData.contact_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2 font-medium">{formData.email}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2 font-medium">{formData.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Address Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Physical Address:</span>
                      <p className="mt-1 ml-4">{formData.address}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Billing Address:</span>
                      <p className="mt-1 ml-4">{formData.billing_address}</p>
                    </div>
                  </div>
                </div>

                {/* Contract Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contract & Storage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contract Period:</span>
                      <span className="ml-2 font-medium">
                        {formData.contract_start_date} to {formData.contract_end_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Storage Plan:</span>
                      <Badge className={`ml-2 ${getStoragePlanDetails(formData.storage_plan).color}`}>
                        {formData.storage_plan}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Storage:</span>
                      <span className="ml-2 font-medium">{formData.max_storage_cubic_feet?.toLocaleString()} ft³</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Monthly Fee:</span>
                      <span className="ml-2 font-medium">${formData.monthly_fee?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

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