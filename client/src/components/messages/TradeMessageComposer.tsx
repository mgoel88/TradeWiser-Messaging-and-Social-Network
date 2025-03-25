import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Users, 
  ShoppingCart, 
  Tag, 
  ArrowRight, 
  Send,
  WifiOff,
  Radio,  // Using Radio instead of Broadcast which doesn't exist
  Globe,
  User
} from 'lucide-react';
import { MessageTemplateSelector } from './MessageTemplateSelector';
import { MessageTemplateForm } from './MessageTemplateForm';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  onSend,
}: TradeMessageComposerProps) {
  const [activeTab, setActiveTab] = useState('compose');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [broadcast, setBroadcast] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<any>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const { toast } = useToast();

  // Get connections
  const { data: connectionsData, isLoading: loadingConnections } = useQuery({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const res = await apiRequest('/api/connections');
      return res.connections || [];
    },
    enabled: isOpen,
  });

  // Get circles
  const { data: circlesData, isLoading: loadingCircles } = useQuery({
    queryKey: ['/api/circles'],
    queryFn: async () => {
      const res = await apiRequest('/api/circles');
      return res.circles || [];
    },
    enabled: isOpen,
  });

  // Get commodities
  const { data: commoditiesData, isLoading: loadingCommodities } = useQuery({
    queryKey: ['/api/commodities'],
    queryFn: async () => {
      const res = await apiRequest('/api/commodities');
      return res.commodities || [];
    },
    enabled: isOpen && !commodityId,
  });

  // Get circles by commodity
  const { data: commodityCirclesData, isLoading: loadingCommodityCircles } = useQuery({
    queryKey: ['/api/circles/by-commodity', commodityId],
    queryFn: async () => {
      const res = await apiRequest(`/api/circles/by-commodity/${commodityId}`);
      return res.circles || [];
    },
    enabled: isOpen && !!commodityId,
  });

  // Form for composing message
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      templateType: messageType,
      templateId: '',
      content: '',
      chatId,
      recipientId,
      recipientType,
      commodityId,
      listingId,
      circleId: null,
      broadcast: false,
      values: {},
      messageType
    }
  });

  // Set values from template
  const processTemplate = (template: string, values: any) => {
    let processed = template;
    
    // Replace variables with values
    Object.keys(values).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processed = processed.replace(regex, values[key] || `{${key}}`);
    });
    
    return processed;
  };

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setTemplateId(template.id);
    setTemplateContent(template.template);
    setValues(template.defaultValues || {});
    
    setValue('templateId', template.id);
    setValue('templateType', template.templateType);
    setValue('content', processTemplate(template.template, template.defaultValues || {}));
    setValue('values', template.defaultValues || {});
  };

  // Handle creating new template
  const handleCreateNewTemplate = () => {
    setTemplateToEdit(null);
    setIsTemplateFormOpen(true);
  };

  // Handle editing template
  const handleEditTemplate = (template: any) => {
    setTemplateToEdit(template);
    setIsTemplateFormOpen(true);
  };

  // Handle saving template
  const handleSaveTemplate = async (template: any) => {
    try {
      // If editing existing template
      if (template.id) {
        const response = await apiRequest(`/api/message-templates/${template.id}`, {
          method: 'PATCH',
          body: JSON.stringify(template),
        });
        
        toast({
          title: 'Template updated',
          description: 'Your template has been updated successfully',
        });
        
        // Update the current template if it's the one being used
        if (templateId === template.id) {
          handleTemplateSelect(response.template);
        }
      } 
      // If creating new template
      else {
        const response = await apiRequest('/api/message-templates', {
          method: 'POST',
          body: JSON.stringify(template),
        });
        
        toast({
          title: 'Template created',
          description: 'Your new template has been created successfully',
        });
        
        // Select the newly created template
        handleTemplateSelect(response.template);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error saving your template',
        variant: 'destructive',
      });
    }
  };

  // Handle deleting template
  const handleDeleteTemplate = async (id: number) => {
    try {
      await apiRequest(`/api/message-templates/${id}`, {
        method: 'DELETE',
      });
      
      toast({
        title: 'Template deleted',
        description: 'The template has been deleted',
      });
      
      // Clear current template if it was the one deleted
      if (templateId === id) {
        setTemplateId(null);
        setTemplateContent('');
        setValues({});
        setValue('templateId', '');
        setValue('content', '');
        setValue('values', {});
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error deleting the template',
        variant: 'destructive',
      });
    }
  };

  // Handle increment template usage
  const incrementTemplateUsage = async (id: number) => {
    if (!id) return;
    
    try {
      await apiRequest(`/api/message-templates/${id}/increment-usage`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  };

  // Update a value
  const updateValue = (key: string, value: any) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    setValue('values', newValues);
    setValue('content', processTemplate(templateContent, newValues));
  };

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      if (templateId) {
        incrementTemplateUsage(templateId);
      }
      
      // If broadcast is enabled, send to multiple recipients
      if (broadcast) {
        const response = await apiRequest('/api/messages/broadcast', {
          method: 'POST',
          body: JSON.stringify({
            content: data.content,
            type: data.templateType,
            templateId: data.templateId,
            commodityId: data.commodityId,
            circleId: data.circleId,
            listingId: data.listingId
          }),
        });
        
        toast({
          title: 'Broadcast sent',
          description: `Message sent to ${response.totalSent} connections`,
        });
        
        onSend({
          ...data,
          broadcast: true,
          recipientCount: response.totalSent,
        });
      } 
      // Otherwise send to a single recipient
      else {
        const response = await apiRequest('/api/messages', {
          method: 'POST',
          body: JSON.stringify({
            chatId: data.chatId,
            recipientId: data.recipientId,
            content: data.content,
            type: data.templateType,
            templateId: data.templateId,
            commodityId: data.commodityId,
            circleId: data.circleId,
            listingId: data.listingId
          }),
        });
        
        onSend({
          ...data,
          messageId: response.message.id,
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error sending your message',
        variant: 'destructive',
      });
    }
  };

  // Handle broadcast toggle
  const handleBroadcastToggle = () => {
    setBroadcast(!broadcast);
    setValue('broadcast', !broadcast);
  };

  // Reset broadcast recipients when broadcast is toggled off
  useEffect(() => {
    if (!broadcast) {
      setSelectedRecipients([]);
      setSelectedCircle(null);
    }
  }, [broadcast]);

  // Toggle recipient selection
  const toggleRecipient = (id: number) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== id));
    } else {
      setSelectedRecipients([...selectedRecipients, id]);
    }
  };

  // Toggle all recipients
  const toggleAllRecipients = () => {
    if (selectedRecipients.length === connectionsData?.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(connectionsData?.map((c: any) => c.id) || []);
    }
  };

  // Calculate the list of recipients for display purposes
  const getSelectedRecipientsCount = () => {
    if (!broadcast) return recipientId ? 1 : 0;
    return selectedRecipients.length;
  };

  // Get the recipient's name
  const getRecipientName = () => {
    if (!recipientId || !connectionsData) return 'Unknown';
    
    const connection = connectionsData.find((c: any) => 
      c.requesterId === recipientId || c.receiverId === recipientId
    );
    
    if (!connection) return 'Unknown';
    
    return connection.requesterId === recipientId 
      ? connection.requesterName 
      : connection.receiverName;
  };

  // Format the broadcast status
  const getBroadcastStatus = () => {
    if (!broadcast) return null;
    
    if (selectedCircle) {
      const circle = circlesData?.find((c: any) => c.id === selectedCircle);
      return `Broadcasting to users in ${circle?.name || 'selected circle'}`;
    }
    
    return `Broadcasting to ${selectedRecipients.length} selected connections`;
  };

  // Handle message preview
  const messagePreview = watch('content');
  
  // Extract variable names from template
  const extractVariables = (template: string) => {
    const regex = /{([^}]+)}/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)]; // Return unique variables
  };
  
  // Get variables from template
  const templateVariables = extractVariables(templateContent);

  // Format the field label
  const formatFieldLabel = (key: string) => {
    return key
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render variable form inputs
  const renderVariableInputs = () => {
    if (!templateVariables.length) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Fill in the details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templateVariables.map(variable => {
            const fieldKey = `values.${variable}`;
            const formattedFieldKey = `values.${variable}Formatted`;
            
            return (
              <div key={variable} className="space-y-2">
                <Label htmlFor={fieldKey}>{formatFieldLabel(variable)}</Label>
                <Input
                  id={fieldKey}
                  value={values[variable] || ''}
                  onChange={(e) => updateValue(variable, e.target.value)}
                  placeholder={`Enter ${formatFieldLabel(variable).toLowerCase()}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {messageType === 'buy_request' && 'Create Buy Request Message'}
              {messageType === 'sell_offer' && 'Create Sell Offer Message'}
              {messageType === 'negotiation' && 'Create Negotiation Message'}
            </DialogTitle>
            <DialogDescription>
              Create a message using templates to communicate with your trading partners
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="compose">Compose Message</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="compose" className="space-y-4">
                <div className="space-y-4">
                  {/* Template selection */}
                  <div className="space-y-2">
                    <Label>Select a Template</Label>
                    <MessageTemplateSelector
                      userId={userId}
                      onSelect={handleTemplateSelect}
                      onCreateNew={handleCreateNewTemplate}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                    />
                  </div>

                  {/* Template variables */}
                  {templateContent && renderVariableInputs()}

                  {/* Commodity Selection */}
                  {!commodityId && (
                    <div className="space-y-2">
                      <Label htmlFor="commodityId">Commodity</Label>
                      <Select
                        value={watch('commodityId')?.toString() || ''}
                        onValueChange={(value) => setValue('commodityId', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a commodity" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCommodities ? (
                            <SelectItem value="loading" disabled>Loading commodities...</SelectItem>
                          ) : (
                            commoditiesData?.map((commodity: any) => (
                              <SelectItem key={commodity.id} value={commodity.id.toString()}>
                                {commodity.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Circle Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="circleId">Trading Circle</Label>
                    <Select
                      value={watch('circleId')?.toString() || ''}
                      onValueChange={(value) => {
                        setValue('circleId', parseInt(value));
                        if (broadcast) setSelectedCircle(parseInt(value));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trading circle" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCommodityCircles ? (
                          <SelectItem value="loading" disabled>Loading circles...</SelectItem>
                        ) : (
                          commodityCirclesData?.map((circle: any) => (
                            <SelectItem key={circle.id} value={circle.id.toString()}>
                              {circle.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Broadcast Toggle */}
                  {!recipientId && (
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="broadcast"
                        checked={broadcast}
                        onCheckedChange={handleBroadcastToggle}
                      />
                      <Label htmlFor="broadcast">
                        Broadcast to multiple connections
                      </Label>
                    </div>
                  )}

                  {/* Recipient Information */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        {broadcast ? 'Broadcasting to:' : 'Sending to:'}
                      </Label>
                      <span className="text-sm font-medium">
                        {getSelectedRecipientsCount()} {getSelectedRecipientsCount() === 1 ? 'recipient' : 'recipients'}
                      </span>
                    </div>
                    {!broadcast && recipientId && (
                      <div className="flex items-center mt-1 p-2 bg-muted rounded-md">
                        <User className="h-4 w-4 mr-2" />
                        <span>{getRecipientName()}</span>
                      </div>
                    )}
                    {broadcast && getBroadcastStatus() && (
                      <div className="flex items-center mt-1 p-2 bg-muted rounded-md">
                        <BroadcastIcon className="h-4 w-4 mr-2" />
                        <span>{getBroadcastStatus()}</span>
                      </div>
                    )}
                  </div>

                  {/* Broadcast Recipient Selection */}
                  {broadcast && !selectedCircle && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Select Recipients</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={toggleAllRecipients}
                        >
                          {selectedRecipients.length === connectionsData?.length 
                            ? 'Deselect All' 
                            : 'Select All'}
                        </Button>
                      </div>
                      <Card>
                        <ScrollArea className="h-[200px]">
                          <div className="p-4 space-y-2">
                            {loadingConnections ? (
                              <div className="text-center py-4">Loading connections...</div>
                            ) : connectionsData?.length > 0 ? (
                              connectionsData.map((connection: any) => {
                                const connectionId = connection.id;
                                const connectionName = 
                                  connection.requesterId === userId 
                                    ? connection.receiverName 
                                    : connection.requesterName;
                                
                                return (
                                  <div 
                                    key={connectionId}
                                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                    onClick={() => toggleRecipient(connectionId)}
                                  >
                                    <Checkbox 
                                      checked={selectedRecipients.includes(connectionId)}
                                      onCheckedChange={() => toggleRecipient(connectionId)}
                                    />
                                    <span>{connectionName}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4">No connections found</div>
                            )}
                          </div>
                        </ScrollArea>
                      </Card>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="content">Message Content</Label>
                    <Textarea
                      {...register('content')}
                      id="content"
                      placeholder="Enter your message content or select a template"
                      className="min-h-[150px]"
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive">{errors.content.message as string}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">Message Preview</h3>
                      <p className="text-sm text-muted-foreground">
                        {messageType === 'buy_request' && 'Buy Request'}
                        {messageType === 'sell_offer' && 'Sell Offer'}
                        {messageType === 'negotiation' && 'Negotiation'}
                      </p>
                    </div>
                    {broadcast ? (
                      <div className="flex items-center">
                        <BroadcastIcon className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="text-sm text-blue-500">Broadcast</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-sm text-green-500">Direct Message</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="whitespace-pre-wrap">
                      {messagePreview || "No content to preview"}
                    </div>
                  </div>
                  
                  <div className="border-t mt-4 pt-4">
                    <div className="flex flex-col space-y-2">
                      {watch('commodityId') && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">Commodity:</span>
                          <span>
                            {loadingCommodities 
                              ? 'Loading...' 
                              : commoditiesData?.find((c: any) => c.id === watch('commodityId'))?.name || 'Unknown'}
                          </span>
                        </div>
                      )}
                      
                      {watch('circleId') && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">Circle:</span>
                          <span>
                            {loadingCommodityCircles 
                              ? 'Loading...' 
                              : commodityCirclesData?.find((c: any) => c.id === watch('circleId'))?.name || 'Unknown'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <span className="font-medium mr-2">Sending to:</span>
                        <span>
                          {broadcast 
                            ? `${getSelectedRecipientsCount()} connections` 
                            : getRecipientName()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!watch('content')}>
                <Send className="h-4 w-4 mr-2" />
                {broadcast ? 'Broadcast Message' : 'Send Message'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Form Dialog */}
      {isTemplateFormOpen && (
        <MessageTemplateForm
          isOpen={isTemplateFormOpen}
          onClose={() => setIsTemplateFormOpen(false)}
          userId={userId}
          templateType={messageType}
          initialTemplate={templateToEdit}
          onSave={handleSaveTemplate}
        />
      )}
    </>
  );
}