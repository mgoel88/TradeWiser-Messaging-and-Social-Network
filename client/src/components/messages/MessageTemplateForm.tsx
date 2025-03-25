import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Star, ChevronDown, Tag, PlusCircle, Trash } from 'lucide-react';
import { messageTemplateSchema, buyRequestTemplateSchema, sellOfferTemplateSchema, negotiationTemplateSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// This component is used to create and edit message templates
export function MessageTemplateForm({
  isOpen,
  onClose,
  userId,
  initialTemplate = null,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  initialTemplate?: any;
  onSave: (template: any) => void;
}) {
  const [templateType, setTemplateType] = useState(initialTemplate?.templateType || 'buy_request');
  const [previewData, setPreviewData] = useState<any>({});
  const [formattedTemplate, setFormattedTemplate] = useState('');
  const { toast } = useToast();

  // Get the appropriate schema based on template type
  const getSchemaByType = (type: string) => {
    switch (type) {
      case 'buy_request':
        return buyRequestTemplateSchema;
      case 'sell_offer':
        return sellOfferTemplateSchema;
      case 'negotiation':
        return negotiationTemplateSchema;
      default:
        return messageTemplateSchema;
    }
  };

  // Form setup
  const form = useForm({
    resolver: zodResolver(getSchemaByType(templateType)),
    defaultValues: {
      userId: userId,
      name: initialTemplate?.name || '',
      templateType: initialTemplate?.templateType || 'buy_request',
      template: initialTemplate?.template || getDefaultTemplate(templateType),
      isDefault: initialTemplate?.isDefault || false,
      isFavorite: initialTemplate?.isFavorite || false,
      defaultValues: initialTemplate?.defaultValues || getDefaultValues(templateType),
    },
  });

  // Update form when template type changes
  useEffect(() => {
    if (!initialTemplate) {
      form.setValue('templateType', templateType);
      form.setValue('template', getDefaultTemplate(templateType));
      form.setValue('defaultValues', getDefaultValues(templateType));
    }
  }, [templateType, form, initialTemplate]);

  // Update formatted template preview
  useEffect(() => {
    const template = form.watch('template');
    const defaultValues = form.watch('defaultValues');
    const formatted = formatTemplate(template, defaultValues || getDefaultValues(templateType));
    setFormattedTemplate(formatted);
  }, [form.watch('template'), form.watch('defaultValues'), templateType]);

  // Format the template with variable placeholders
  const formatTemplate = (template: string, values: any) => {
    let result = template;
    Object.keys(values || {}).forEach(key => {
      const placeholder = `{${key}}`;
      const value = values[key] || placeholder;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });
    return result;
  };

  // Get default template text based on template type
  function getDefaultTemplate(type: string): string {
    switch (type) {
      case 'buy_request':
        return `Looking to buy {commodityName} with the following details:

Quantity: {quantity} {unit}
Price: ₹{pricePerUnit} per {unit}
Quality: {quality}
Delivery Terms: {deliveryTerms}
Payment Terms: {paymentTerms}
Location: {location}
Valid Until: {validityPeriod}

Additional Requirements:
{additionalRequirements}

Please contact me if you can supply as per these specifications.`;
      
      case 'sell_offer':
        return `Offering {commodityName} for sale with the following specifications:

Quantity: {quantity} {unit}
Price: ₹{pricePerUnit} per {unit}
Quality: {quality}
Quality Specifications:
{qualitySpecsFormatted}

Delivery Terms: {deliveryTerms}
Payment Terms: {paymentTerms}
Location: {location}
Available: {availableFrom} to {availableTo}

Discounts/Tolerance:
{discountsFormatted}

Samples Available: {samplesAvailable}
Certification: {certification}

Contact for immediate purchase.`;
      
      case 'negotiation':
        return `Regarding your inquiry/offer:

I would like to counter with ₹{counterOffer} per unit.
Proposed Quantity: {proposedQuantity}
Proposed Delivery Date: {proposedDeliveryDate}
Proposed Payment Terms: {proposedPaymentTerms}

Additional Terms:
{additionalTerms}

Let me know if this works for you.`;
      
      default:
        return '';
    }
  }

  // Get default values based on template type
  function getDefaultValues(type: string): any {
    switch (type) {
      case 'buy_request':
        return {
          commodityName: 'Wheat',
          commodityId: null,
          quantity: 100,
          unit: 'quintal',
          pricePerUnit: 2500,
          quality: 'Premium Grade A',
          deliveryTerms: 'Ex-warehouse, buyer arranges transport',
          paymentTerms: '50% advance, 50% on delivery inspection',
          location: 'Indore, MP',
          validityPeriod: '1 week',
          additionalRequirements: 'Moisture content < 12%, foreign matter < 0.5%'
        };
      
      case 'sell_offer':
        return {
          commodityName: 'Rice (Basmati)',
          commodityId: null,
          quantity: 50,
          unit: 'quintal',
          pricePerUnit: 5000,
          quality: 'Premium Export Quality',
          qualitySpecs: {
            'Length': '> 7mm',
            'Broken': '< 5%',
            'Moisture': '< 14%'
          },
          qualitySpecsFormatted: '- Length: > 7mm\n- Broken: < 5%\n- Moisture: < 14%',
          deliveryTerms: 'FOB Delhi, packaging included',
          paymentTerms: 'LC at sight or 70% advance, 30% before dispatch',
          discounts: {
            'Moisture 14-15%': '₹100 per quintal',
            'Broken 5-7%': '₹150 per quintal'
          },
          discountsFormatted: '- Moisture 14-15%: ₹100 per quintal\n- Broken 5-7%: ₹150 per quintal',
          location: 'Delhi',
          availableFrom: 'Immediate',
          availableTo: '15 days',
          samplesAvailable: 'Yes',
          certification: 'FSSAI, APEDA'
        };
      
      case 'negotiation':
        return {
          counterOffer: 4800,
          proposedQuantity: 30,
          proposedDeliveryDate: 'Within 7 days',
          proposedPaymentTerms: '100% LC',
          additionalTerms: 'Will need certificate of analysis before shipping'
        };
      
      default:
        return {};
    }
  }

  // Handle form submission
  const onSubmit = (data: any) => {
    // Format any structured data for display
    if (data.templateType === 'sell_offer') {
      if (data.defaultValues?.qualitySpecs) {
        data.defaultValues.qualitySpecsFormatted = Object.entries(data.defaultValues.qualitySpecs)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n');
      }
      
      if (data.defaultValues?.discounts) {
        data.defaultValues.discountsFormatted = Object.entries(data.defaultValues.discounts)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n');
      }
    }
    
    // Save the template
    onSave({
      ...data,
      id: initialTemplate?.id,
      usageCount: initialTemplate?.usageCount || 0,
      lastUsedAt: initialTemplate?.lastUsedAt || null
    });
    
    // Show toast notification
    toast({
      title: initialTemplate ? "Template updated" : "Template created",
      description: `Your "${data.name}" template has been saved successfully.`,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                {/* Template basics */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter template name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!initialTemplate && (
                    <FormField
                      control={form.control}
                      name="templateType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setTemplateType(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="buy_request">Open to Buy</SelectItem>
                              <SelectItem value="sell_offer">Offer for Sale</SelectItem>
                              <SelectItem value="negotiation">Negotiation</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="isFavorite"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Favorite</FormLabel>
                            <FormDescription>
                              Mark this template as a favorite
                            </FormDescription>
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
                  </div>
                </div>
                
                <Separator />
                
                {/* Template content */}
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Template Content</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => field.onChange(getDefaultTemplate(templateType))}
                        >
                          Reset to Default
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Enter template content with {placeholders} for variables"
                          className="min-h-[300px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use {"{variableName}"} to create placeholders that will be replaced with actual values.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Preview and default values panel */}
              <div className="space-y-4">
                <Tabs defaultValue="preview">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="defaults">Default Values</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div className="border rounded-md p-4 min-h-[300px] whitespace-pre-wrap bg-muted/30">
                      {formattedTemplate}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="defaults" className="space-y-4">
                    <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                      {/* Default values form based on template type */}
                      {templateType === 'buy_request' && (
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="defaultValues.commodityName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Commodity</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="defaultValues.quantity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="0" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defaultValues.unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.pricePerUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price per Unit (₹)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" min="0" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.quality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quality</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.deliveryTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Terms</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.paymentTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Terms</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.validityPeriod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Validity Period</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.additionalRequirements"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Requirements</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {templateType === 'sell_offer' && (
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="defaultValues.commodityName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Commodity</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="defaultValues.quantity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="0" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defaultValues.unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.pricePerUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price per Unit (₹)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" min="0" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.quality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quality</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="defaultValues.qualitySpecsFormatted"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quality Specifications</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    rows={3} 
                                    placeholder="Format as:&#10;- Parameter: Value&#10;- Parameter: Value"
                                  />
                                </FormControl>
                                <FormDescription>
                                  List each specification as "- Parameter: Value" on a new line
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.deliveryTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Terms</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.paymentTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Terms</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.discountsFormatted"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discounts/Tolerance</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    rows={3}
                                    placeholder="Format as:&#10;- Condition: Discount&#10;- Condition: Discount"
                                  />
                                </FormControl>
                                <FormDescription>
                                  List each discount as "- Condition: Discount" on a new line
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="defaultValues.availableFrom"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Available From</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defaultValues.availableTo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Available To</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.samplesAvailable"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Samples Available</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Samples available?" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                    <SelectItem value="On Request">On Request</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.certification"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Certification</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {templateType === 'negotiation' && (
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="defaultValues.counterOffer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Counter Offer (₹)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" min="0" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.proposedQuantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Proposed Quantity</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.proposedDeliveryDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Proposed Delivery Date</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.proposedPaymentTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Proposed Payment Terms</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="defaultValues.additionalTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Terms</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {templateType === 'custom' && (
                        <div className="flex items-center justify-center h-[200px]">
                          <p className="text-sm text-muted-foreground">
                            Custom templates can use any variables you define in your template.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {initialTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}