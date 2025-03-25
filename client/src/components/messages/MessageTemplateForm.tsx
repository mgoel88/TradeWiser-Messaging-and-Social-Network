import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// Create a validation schema
const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  template: z.string().min(10, 'Template content must be at least 10 characters'),
  templateType: z.enum(['buy_request', 'sell_offer', 'negotiation', 'custom']),
  defaultValues: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

interface MessageTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  templateType?: 'buy_request' | 'sell_offer' | 'negotiation' | 'custom';
  initialTemplate?: any;
  onSave: (template: any) => void;
}

export function MessageTemplateForm({
  isOpen,
  onClose,
  userId,
  templateType = 'custom',
  initialTemplate,
  onSave,
}: MessageTemplateFormProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [contentHelp, setContentHelp] = useState(false);
  const { toast } = useToast();

  // Define default template content by type
  function getDefaultTemplate(type: string): string {
    switch (type) {
      case 'buy_request':
        return `I'm looking to buy {commodity} with the following details:

Quantity: {quantity} {unit}
Price: Up to {price} per {unit}
Quality: {quality}
Delivery: {deliveryMethod}
Location: {location}
Payment terms: {paymentTerms}

Variance tolerance:
- Quality: {qualityVarianceTolerance}
- Quantity: {quantityVarianceTolerance}
- Price adjustment for lower quality: {priceAdjustment}

Please let me know if you can supply this commodity.`;

      case 'sell_offer':
        return `I have {commodity} available for sale with the following specifications:

Quantity: {quantity} {unit}
Price: {price} per {unit}
Quality: {quality}
Delivery options: {deliveryOptions}
Available from: {availableFrom}
Location: {location}
Payment terms: {paymentTerms}

Please let me know if you're interested in purchasing.`;

      case 'negotiation':
        return `Regarding your {messageType} for {commodity}:

I can {action} at the following terms:
- Quantity: {quantity} {unit}
- Price: {price} per {unit}
- Delivery: {deliveryMethod}
- Payment: {paymentTerms}

{additionalTerms}

Let me know if this works for you.`;

      default:
        return '';
    }
  }

  // Define default values for each template type
  function getDefaultValues(type: string): any {
    switch (type) {
      case 'buy_request':
        return {
          commodity: '',
          quantity: '',
          unit: 'kg',
          price: '',
          quality: '',
          deliveryMethod: 'Pickup',
          location: '',
          paymentTerms: 'Cash on delivery',
          qualityVarianceTolerance: 'Up to 5% reduction in agreed parameters',
          quantityVarianceTolerance: '±5%',
          priceAdjustment: 'Proportional to quality reduction',
        };
      case 'sell_offer':
        return {
          commodity: '',
          quantity: '',
          unit: 'kg',
          price: '',
          quality: '',
          deliveryOptions: 'Pickup or delivery (extra charges apply)',
          availableFrom: new Date().toISOString().split('T')[0],
          location: '',
          paymentTerms: 'Cash on delivery',
        };
      case 'negotiation':
        return {
          messageType: 'offer',
          commodity: '',
          action: 'offer',
          quantity: '',
          unit: 'kg',
          price: '',
          deliveryMethod: 'Pickup',
          paymentTerms: 'Cash on delivery',
          additionalTerms: '',
        };
      default:
        return {};
    }
  }
  
  // Initialize form with either initial template data or defaults
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: initialTemplate 
      ? { 
          ...initialTemplate,
          defaultValues: initialTemplate.defaultValues || getDefaultValues(initialTemplate.templateType),
        } 
      : {
          name: '',
          template: getDefaultTemplate(templateType),
          templateType: templateType,
          defaultValues: getDefaultValues(templateType),
          isDefault: false,
          isFavorite: false,
        }
  });

  // Effect to update template when template type changes
  const currentTemplateType = watch('templateType');
  
  useEffect(() => {
    if (!initialTemplate && currentTemplateType !== templateType) {
      setValue('template', getDefaultTemplate(currentTemplateType));
      setValue('defaultValues', getDefaultValues(currentTemplateType));
    }
  }, [currentTemplateType, initialTemplate, setValue, templateType]);

  // Handle form submission
  const onSubmit = (data: any) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required to create a template",
        variant: "destructive",
      });
      return;
    }

    const template = {
      ...data,
      userId,
      id: initialTemplate?.id
    };

    onSave(template);
    onClose();
  };

  // Component to edit default values
  const TemplateDefaultValuesEditor = ({ type, defaultValues }: { type: string, defaultValues: any }) => {
    switch (type) {
      case 'buy_request':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity</Label>
                <Input 
                  id="commodity"
                  placeholder="e.g., Wheat"
                  {...register('defaultValues.commodity')}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity"
                    type="text"
                    placeholder="e.g., 1000"
                    {...register('defaultValues.quantity')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    defaultValue={defaultValues.unit}
                    onValueChange={(value) => setValue('defaultValues.unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="quintal">Quintal</SelectItem>
                      <SelectItem value="ton">Metric Ton</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (per unit)</Label>
                <Input 
                  id="price"
                  placeholder="e.g., 1500"
                  {...register('defaultValues.price')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Input 
                  id="quality"
                  placeholder="e.g., Grade A"
                  {...register('defaultValues.quality')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery Method</Label>
                <Select 
                  defaultValue={defaultValues.deliveryMethod}
                  onValueChange={(value) => setValue('defaultValues.deliveryMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Delivery Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pickup">Pickup from seller</SelectItem>
                    <SelectItem value="Delivery">Delivery by seller</SelectItem>
                    <SelectItem value="Negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  placeholder="e.g., Delhi APMC"
                  {...register('defaultValues.location')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select 
                defaultValue={defaultValues.paymentTerms}
                onValueChange={(value) => setValue('defaultValues.paymentTerms', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash on delivery">Cash on delivery</SelectItem>
                  <SelectItem value="Advance payment">Advance payment</SelectItem>
                  <SelectItem value="Net 7">Net 7 days</SelectItem>
                  <SelectItem value="Net 15">Net 15 days</SelectItem>
                  <SelectItem value="Net 30">Net 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Variance Tolerance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualityVarianceTolerance">Quality Variance</Label>
                  <Input 
                    id="qualityVarianceTolerance"
                    placeholder="e.g., Up to 5% reduction"
                    {...register('defaultValues.qualityVarianceTolerance')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityVarianceTolerance">Quantity Variance</Label>
                  <Input 
                    id="quantityVarianceTolerance"
                    placeholder="e.g., ±5%"
                    {...register('defaultValues.quantityVarianceTolerance')}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="priceAdjustment">Price Adjustment</Label>
                <Input 
                  id="priceAdjustment"
                  placeholder="e.g., Proportional to quality reduction"
                  {...register('defaultValues.priceAdjustment')}
                />
              </div>
            </div>
          </div>
        );
        
      case 'sell_offer':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity</Label>
                <Input 
                  id="commodity"
                  placeholder="e.g., Wheat"
                  {...register('defaultValues.commodity')}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity"
                    type="text"
                    placeholder="e.g., 1000"
                    {...register('defaultValues.quantity')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    defaultValue={defaultValues.unit}
                    onValueChange={(value) => setValue('defaultValues.unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="quintal">Quintal</SelectItem>
                      <SelectItem value="ton">Metric Ton</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (per unit)</Label>
                <Input 
                  id="price"
                  placeholder="e.g., 1500"
                  {...register('defaultValues.price')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Input 
                  id="quality"
                  placeholder="e.g., Grade A"
                  {...register('defaultValues.quality')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryOptions">Delivery Options</Label>
                <Input 
                  id="deliveryOptions"
                  placeholder="e.g., Pickup or delivery (charges apply)"
                  {...register('defaultValues.deliveryOptions')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From</Label>
                <Input 
                  id="availableFrom"
                  type="date"
                  {...register('defaultValues.availableFrom')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  placeholder="e.g., Delhi APMC"
                  {...register('defaultValues.location')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select 
                  defaultValue={defaultValues.paymentTerms}
                  onValueChange={(value) => setValue('defaultValues.paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash on delivery">Cash on delivery</SelectItem>
                    <SelectItem value="Advance payment">Advance payment</SelectItem>
                    <SelectItem value="Net 7">Net 7 days</SelectItem>
                    <SelectItem value="Net 15">Net 15 days</SelectItem>
                    <SelectItem value="Net 30">Net 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 'negotiation':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="messageType">Original Message Type</Label>
                <Select 
                  defaultValue={defaultValues.messageType}
                  onValueChange={(value) => setValue('defaultValues.messageType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Message Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Sell Offer</SelectItem>
                    <SelectItem value="request">Buy Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Your Action</Label>
                <Select 
                  defaultValue={defaultValues.action}
                  onValueChange={(value) => setValue('defaultValues.action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Make Counter Offer</SelectItem>
                    <SelectItem value="accept">Accept with Conditions</SelectItem>
                    <SelectItem value="request information">Request More Information</SelectItem>
                    <SelectItem value="decline">Decline with Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commodity">Commodity</Label>
              <Input 
                id="commodity"
                placeholder="e.g., Wheat"
                {...register('defaultValues.commodity')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity"
                  placeholder="e.g., 1000"
                  {...register('defaultValues.quantity')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  defaultValue={defaultValues.unit}
                  onValueChange={(value) => setValue('defaultValues.unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="quintal">Quintal</SelectItem>
                    <SelectItem value="ton">Metric Ton</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input 
                  id="price"
                  placeholder="e.g., 1500"
                  {...register('defaultValues.price')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery Method</Label>
                <Select 
                  defaultValue={defaultValues.deliveryMethod}
                  onValueChange={(value) => setValue('defaultValues.deliveryMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Delivery Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pickup">Pickup from seller</SelectItem>
                    <SelectItem value="Delivery">Delivery by seller</SelectItem>
                    <SelectItem value="Negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select 
                  defaultValue={defaultValues.paymentTerms}
                  onValueChange={(value) => setValue('defaultValues.paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash on delivery">Cash on delivery</SelectItem>
                    <SelectItem value="Advance payment">Advance payment</SelectItem>
                    <SelectItem value="Net 7">Net 7 days</SelectItem>
                    <SelectItem value="Net 15">Net 15 days</SelectItem>
                    <SelectItem value="Net 30">Net 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalTerms">Additional Terms & Conditions</Label>
              <Textarea 
                id="additionalTerms"
                placeholder="Any additional terms or conditions for the negotiation..."
                {...register('defaultValues.additionalTerms')}
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                For custom templates, you'll need to define your own variables in the template content.
                Use the format {'{variableName}'} to define variables. For example: {'{commodity}'}, {'{price}'}, etc.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogDescription>
            Create reusable templates for trading messages
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input 
                  id="name"
                  {...register('name')}
                  placeholder="E.g., Standard Wheat Buy Request"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select 
                  defaultValue={initialTemplate?.templateType || templateType}
                  onValueChange={(value) => setValue('templateType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy_request">Buy Request</SelectItem>
                    <SelectItem value="sell_offer">Sell Offer</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {errors.templateType && (
                  <p className="text-sm text-destructive">{errors.templateType.message as string}</p>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Template Content</TabsTrigger>
                  <TabsTrigger value="defaultValues">Default Values</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="template">Template Content</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        type="button"
                        onClick={() => setContentHelp(!contentHelp)}
                      >
                        Help
                      </Button>
                    </div>
                    {contentHelp && (
                      <div className="p-3 bg-muted rounded-md mb-2">
                        <p className="text-sm text-muted-foreground">
                          Use curly braces to define variables in your template: {'{variableName}'}
                          <br />
                          These variables will be replaced with actual values when sending messages.
                          <br />
                          Example: "I want to buy {'{quantity}'} {'{unit}'} of {'{commodity}'}"
                        </p>
                      </div>
                    )}
                    <Textarea 
                      id="template"
                      {...register('template')}
                      placeholder="Enter your template content here..."
                      className="h-48 font-mono"
                    />
                    {errors.template && (
                      <p className="text-sm text-destructive">{errors.template.message as string}</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="defaultValues" className="space-y-4 pt-4">
                  <TemplateDefaultValuesEditor 
                    type={watch('templateType')} 
                    defaultValues={watch('defaultValues')} 
                  />
                </TabsContent>
              </Tabs>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isFavorite" 
                    checked={watch('isFavorite')}
                    onCheckedChange={(checked) => setValue('isFavorite', checked as boolean)}
                  />
                  <Label htmlFor="isFavorite">Mark as favorite</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}