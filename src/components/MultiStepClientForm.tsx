import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Warehouse,
  CheckCircle,
  X,
} from 'lucide-react';
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const clientSchema = z.object({
  client_code: z.string().min(1, 'Client code is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_email: z.string().email('Valid email required').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  billing_address: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  storage_plan: z.enum(['basic', 'premium', 'enterprise']).optional(),
  max_storage_cubic_feet: z.number().optional(),
  monthly_fee: z.number().optional(),
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
  const { toast } = useToast();
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      client_code: client.client_code,
      company_name: client.company_name,
      contact_email: client.email,
      contact_phone: client.phone,
      address: client.address,
      billing_address: client.billing_address,
      contract_start_date: client.contract_start_date,
      contract_end_date: client.contract_end_date,
      storage_plan: client.storage_plan,
      max_storage_cubic_feet: client.max_storage_cubic_feet,
      monthly_fee: client.monthly_fee,
      is_active: client.is_active,
      location_type: client.location_type,
      assigned_floor_zone_id: client.assigned_floor_zone_id,
      assigned_row_id: client.assigned_row_id,
    } : {
      client_code: '',
      company_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      billing_address: '',
      storage_plan: 'basic',
      max_storage_cubic_feet: 1000,
      monthly_fee: 0,
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
        const lt = form.getValues('location_type');
        if (lt === 'floor_zone') return ['location_type', 'assigned_floor_zone_id'];
        if (lt === 'shelf_row') return ['location_type', 'assigned_row_id'];
        return [];
      default:
        return [];
    }
  };

  const handleSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      contact_name: data.contact_email || '',
      email: data.contact_email || '',
      phone: data.contact_phone || '',
    } as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
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

          <div className="grid grid-cols-3 gap-4">
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="storage_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_storage_cubic_feet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Storage (cu ft)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
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
                        <FormLabel>Monthly Fee ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
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
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Floor Zone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a floor zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {floorZones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id}>
                                {zone.code} - {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              <SelectValue placeholder="Choose a shelf row" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shelfRows.map((row) => (
                              <SelectItem key={row.id} value={row.id}>
                                {row.code} - Row {row.row_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
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
                      <span className="text-muted-foreground">Storage Plan:</span>
                      <Badge>{formData.storage_plan}</Badge>
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
              <Button type="submit">
                {client ? 'Update Client' : 'Create Client'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
