import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Search, 
  Package, 
  FileText, Truck, 
  Calendar, 
  DollarSign, 
  Clock, 
  Edit, 
  Save, 
  Trash, 
  AlertCircle,
  UserPlus,
  Broadcast
} from 'lucide-react';

import { templatedMessageFormSchema, MessageTemplate } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MessageTemplateSelector } from './MessageTemplateSelector';
import { MessageTemplateForm } from './MessageTemplateForm';

interface TradeMessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  chatId?: number;
  recipientId?: number;
  recipientType?: 'user' | 'group' | 'broadcast';
  commodityId?: number;
  listingId?: number;
  messageType?: 'buy_request' | 'sell_offer' | 'negotiation';
  onSend: (message: any) => void;
}

export function TradeMessageComposer({
  isOpen,
  onClose,
  userId,
  chatId,
  recipientId,
  recipientType = 'user',
  commodityId,
  listingId,
  messageType = 'buy_request',
  onSend
}: TradeMessageComposerProps) {
  const [tab, setTab] = useState<string>('select');
  const [step, setStep] = useState<string>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState<boolean>(false);
  const [templateToEdit, setTemplateToEdit] = useState<MessageTemplate | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [availableCommodities, setAvailableCommodities] = useState<any[]>([]);
  const [availableCircles, setAvailableCircles] = useState<any[]>([]);
  const [formattedMessage, setFormattedMessage] = useState<string>('');
  const [useDefaultValues, setUseDefaultValues] = useState<boolean>(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load recipients (connects, circles)
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        // Get connections
        const connectionsResponse = await apiRequest('/api/connections');
        
        // Get available circles
        const circlesResponse = await apiRequest('/api/user-circles');
        
        // Combine into a recipients list
        const allRecipients = [
          ...(connectionsResponse.connections || []).map((connection: any) => ({
            id: connection.id,
            userId: connection.receiverId === userId ? connection.requesterId : connection.receiverId,
            name: connection.receiver?.name || connection.requester?.name,
            avatar: connection.receiver?.avatar || connection.requester?.avatar,
            type: 'user'
          })),
          ...(circlesResponse.circles || []).map((circle: any) => ({
            id: circle.id,
            circleId: circle.circleId,
            name: circle.circle?.name,
            memberCount: circle.circle?.memberCount || 0,
            type: 'circle'
          }))
        ];
        
        setRecipients(allRecipients);
      } catch (error) {
        console.error('Error fetching recipients', error);
      }
    };
    
    fetchRecipients();
  }, [userId]);

  // Load commodities and circles
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get commodities
        const commoditiesResponse = await apiRequest('/api/commodities');
        setAvailableCommodities(commoditiesResponse.commodities || []);
        
        // Get circles
        const circlesResponse = await apiRequest('/api/circles');
        setAvailableCircles(circlesResponse.circles || []);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    
    fetchData();
  }, []);

  // Form for the message values
  const form = useForm({
    resolver: zodResolver(templatedMessageFormSchema),
    defaultValues: {
      templateId: 0,
      chatId: chatId || null,
      content: '',
      messageType: 'template',
      templateType: messageType,
      recipientId: recipientId || null,
      recipientType: recipientType,
      commodityId: commodityId || null,
      circleId: null,
      listingId: listingId || null,
      broadcast: recipientType === 'broadcast',
      values: {}
    }
  });

  // Update form values when template changes
  useEffect(() => {
    if (selectedTemplate) {
      form.setValue('templateId', selectedTemplate.id);
      form.setValue('templateType', selectedTemplate.templateType as any);
      form.setValue('content', selectedTemplate.template);
      
      if (useDefaultValues && selectedTemplate.defaultValues) {
        form.setValue('values', selectedTemplate.defaultValues);
        updateFormattedMessage(selectedTemplate.template, selectedTemplate.defaultValues);
      } else {
        // Clear values if not using defaults
        const emptyValues = {};
        const templateText = selectedTemplate.template;
        const placeholderMatches = templateText.match(/\{([^}]+)\}/g) || [];
        
        placeholderMatches.forEach(match => {
          const key = match.substring(1, match.length - 1);
          // @ts-ignore
          emptyValues[key] = '';
        });
        
        form.setValue('values', emptyValues);
        updateFormattedMessage(selectedTemplate.template, emptyValues);
      }
    }
  }, [selectedTemplate, useDefaultValues, form]);

  // Format the message with the current values
  const updateFormattedMessage = (template: string, values: any) => {
    let result = template;
    
    Object.keys(values || {}).forEach(key => {
      const placeholder = `{${key}}`;
      const value = values[key] !== undefined && values[key] !== null ? values[key] : placeholder;
      
      // If the value is an object (like qualitySpecs), we'll use the formatted version if available
      const formattedKey = `${key}Formatted`;
      if (typeof value === 'object' && values[formattedKey]) {
        result = result.replace(new RegExp(placeholder, 'g'), values[formattedKey]);
      } else {
        result = result.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });
    
    setFormattedMessage(result);
  };

  // Handle value changes to update formatted message
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.startsWith('values.') && selectedTemplate) {
        updateFormattedMessage(selectedTemplate.template, value.values);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, selectedTemplate]);

  // Create a new template
  const createTemplate = (template: any) => {
    createTemplateMutation.mutate(template);
  };

  // Update an existing template
  const updateTemplate = (template: any) => {
    updateTemplateMutation.mutate(template);
  };

  // Delete a template
  const deleteTemplate = (templateId: number) => {
    deleteTemplateMutation.mutate(templateId);
  };

  // Handle template form open/close
  const handleCreateNew = () => {
    setTemplateToEdit(null);
    setIsTemplateFormOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setTemplateToEdit(template);
    setIsTemplateFormOpen(true);
  };

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const data = await apiRequest('/api/message-templates', {
        method: 'POST',
        body: JSON.stringify(template)
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user', userId] });
      toast({
        title: "Template created",
        description: "Your new template has been created successfully.",
      });
      setSelectedTemplate(data.template);
    },
    onError: (error) => {
      toast({
        title: "Error creating template",
        description: "There was an error creating your template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const data = await apiRequest(`/api/message-templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify(template)
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user', userId] });
      toast({
        title: "Template updated",
        description: "Your template has been updated successfully.",
      });
      if (selectedTemplate?.id === data.template.id) {
        setSelectedTemplate(data.template);
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating template",
        description: "There was an error updating your template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const data = await apiRequest(`/api/message-templates/${templateId}`, {
        method: 'DELETE'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user', userId] });
      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully.",
      });
      if (selectedTemplate?.id === templateToEdit?.id) {
        setSelectedTemplate(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error deleting template",
        description: "There was an error deleting your template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: any) => {
      const endpoint = message.recipientType === 'user' 
        ? '/api/messages' 
        : message.recipientType === 'broadcast'
          ? '/api/messages/broadcast'
          : '/api/messages/group';
          
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          ...message,
          content: formattedMessage
        })
      });
      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries based on recipient type
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // If a template was used, increment its usage count
      if (selectedTemplate) {
        incrementTemplateUsageMutation.mutate(selectedTemplate.id);
      }
      
      toast({
        title: "Message sent",
        description: "Your trade message has been sent successfully.",
      });
      
      // Call the onSend callback with the message data
      onSend(data.message);
      
      // Close the composer
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Increment template usage count
  const incrementTemplateUsageMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const data = await apiRequest(`/api/message-templates/${templateId}/increment-usage`, {
        method: 'POST'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user', userId] });
    }
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    // Add formatted message to the data
    data.content = formattedMessage;
    
    // Convert values for proper JSON serialization
    Object.keys(data.values).forEach(key => {
      if (typeof data.values[key] === 'object' && data.values[key] !== null) {
        // For objects like qualitySpecs and discounts, ensure they're properly formatted
        if (!data.values[`${key}Formatted`]) {
          data.values[`${key}Formatted`] = Object.entries(data.values[key])
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');
        }
      }
    });
    
    // Send the message
    sendMessageMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {messageType === 'buy_request' 
                ? 'Create Buy Request' 
                : messageType === 'sell_offer' 
                  ? 'Create Sell Offer' 
                  : 'Create Negotiation'}
            </DialogTitle>
            <DialogDescription>
              Create a templated message to broadcast your trade requirements or offers to potential partners.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Template</TabsTrigger>
              <TabsTrigger value="customize">Customize & Send</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="space-y-4 mt-2">
              <MessageTemplateSelector
                userId={userId}
                onSelect={(template) => {
                  setSelectedTemplate(template);
                  setTab('customize');
                }}
                onCreateNew={handleCreateNew}
                onEdit={handleEditTemplate}
                onDelete={deleteTemplate}
              />
            </TabsContent>
            
            <TabsContent value="customize" className="space-y-4 mt-2">
              {selectedTemplate ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">
                              {selectedTemplate.name}
                            </h3>
                            <Badge 
                              className={
                                selectedTemplate.templateType === 'buy_request'
                                  ? 'bg-green-100 text-green-800'
                                  : selectedTemplate.templateType === 'sell_offer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }
                            >
                              {selectedTemplate.templateType === 'buy_request'
                                ? 'Open to Buy'
                                : selectedTemplate.templateType === 'sell_offer'
                                ? 'Offer for Sale'
                                : 'Negotiation'}
                            </Badge>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={useDefaultValues}
                              onCheckedChange={setUseDefaultValues}
                              id="use-defaults"
                            />
                            <label htmlFor="use-defaults" className="text-sm font-medium">
                              Use default values
                            </label>
                          </div>
                          
                          <div className="p-4 border rounded-md bg-muted/20">
                            <h4 className="font-medium mb-3">Template Values</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedTemplate && form.getValues('values') && Object.keys(form.getValues('values')).map((key) => {
                                // Skip formatted fields that are derived
                                if (key.endsWith('Formatted')) return null;
                                
                                // Skip complex objects that have formatted versions
                                if (
                                  typeof form.getValues(`values.${key}`) === 'object' && 
                                  form.getValues(`values.${key}Formatted`) !== undefined
                                ) return null;
                                
                                return (
                                  <FormField
                                    key={key}
                                    control={form.control}
                                    name={`values.${key}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</FormLabel>
                                        <FormControl>
                                          {key.includes('additional') || key.includes('terms') ? (
                                            <Textarea 
                                              {...field} 
                                              value={String(field.value || '')}
                                              className="h-20"
                                            />
                                          ) : (
                                            <Input 
                                              {...field} 
                                              value={String(field.value || '')}
                                              type={
                                                key.includes('price') || key.includes('quantity') ? 'number' : 'text'
                                              }
                                            />
                                          )}
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                );
                              })}
                              
                              {/* Special handling for formatted multi-line fields */}
                              {selectedTemplate && form.getValues('values') && Object.keys(form.getValues('values'))
                                .filter(key => key.endsWith('Formatted'))
                                .map((key) => (
                                  <FormField
                                    key={key}
                                    control={form.control}
                                    name={`values.${key}`}
                                    render={({ field }) => (
                                      <FormItem className="col-span-2">
                                        <FormLabel>
                                          {key
                                            .replace('Formatted', '')
                                            .charAt(0).toUpperCase() + 
                                            key.replace('Formatted', '').slice(1)
                                            .replace(/([A-Z])/g, ' $1')}
                                        </FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            {...field} 
                                            value={String(field.value || '')}
                                            className="h-24"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                ))
                              }
                            </div>
                          </div>
                          
                          {/* Recipient selection if not in a chat */}
                          {!chatId && (
                            <div className="space-y-4">
                              <h4 className="font-medium">Recipients</h4>
                              
                              <FormField
                                control={form.control}
                                name="recipientType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Send to</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('broadcast', value === 'broadcast');
                                      }}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select recipient type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="user">Individual User</SelectItem>
                                        <SelectItem value="circle">Circle Members</SelectItem>
                                        <SelectItem value="broadcast">Broadcast to All Connections</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              
                              {form.watch('recipientType') === 'user' && (
                                <FormField
                                  control={form.control}
                                  name="recipientId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Select User</FormLabel>
                                      <Select
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                        value={field.value?.toString() || ''}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a user" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {recipients
                                            .filter(r => r.type === 'user')
                                            .map((recipient) => (
                                              <SelectItem 
                                                key={recipient.userId} 
                                                value={recipient.userId.toString()}
                                              >
                                                {recipient.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              )}
                              
                              {form.watch('recipientType') === 'circle' && (
                                <FormField
                                  control={form.control}
                                  name="circleId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Select Circle</FormLabel>
                                      <Select
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                        value={field.value?.toString() || ''}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a circle" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {availableCircles.map((circle) => (
                                            <SelectItem 
                                              key={circle.id} 
                                              value={circle.id.toString()}
                                            >
                                              {circle.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Commodity selection if not provided */}
                          {!commodityId && (
                            <FormField
                              control={form.control}
                              name="commodityId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Select Commodity</FormLabel>
                                  <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    value={field.value?.toString() || ''}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a commodity" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableCommodities.map((commodity) => (
                                        <SelectItem 
                                          key={commodity.id} 
                                          value={commodity.id.toString()}
                                        >
                                          {commodity.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Message Preview</h4>
                        <div className="border rounded-md p-4 bg-muted/10 whitespace-pre-wrap min-h-[300px]">
                          {formattedMessage}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setTab('select')}>
                        Back to Templates
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!selectedTemplate || !formattedMessage || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-center space-y-3">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No Template Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Please select a template from the previous tab or create a new one.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setTab('select')}
                    >
                      Go Back to Template Selection
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Template Creation/Editing Form */}
      {isTemplateFormOpen && (
        <MessageTemplateForm
          isOpen={isTemplateFormOpen}
          onClose={() => setIsTemplateFormOpen(false)}
          userId={userId}
          initialTemplate={templateToEdit}
          onSave={templateToEdit ? updateTemplate : createTemplate}
        />
      )}
    </>
  );
}