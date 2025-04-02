
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, FileText, X, Hash, Calendar, Pen, User, Coins, Truck } from 'lucide-react';
import { MessageTemplateSelector, MessageTemplate } from './MessageTemplateSelector';
import { MessageTemplateForm } from './MessageTemplateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  userId?: number;
  messageType?: string;
  recipientId?: number;
  commodityId?: number;
  onSend?: (message: any) => void;
}

export const TradeMessageComposer: React.FC<Props> = ({
  isOpen = false,
  onClose,
  userId,
  messageType = 'template',
  recipientId,
  commodityId,
  onSend
}) => {
  const [message, setMessage] = useState('');
  const [currentTab, setCurrentTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const { toast } = useToast();
  
  // Get commodities for the dropdown
  const { data: commoditiesData, isLoading: isCommoditiesLoading } = useQuery({
    queryKey: ['/api/commodities'],
    enabled: !!isOpen,
  });
  
  // Get recipient information if recipientId is provided
  const { data: recipientData, isLoading: isRecipientLoading } = useQuery({
    queryKey: ['/api/users', recipientId],
    enabled: !!recipientId && isOpen,
  });
  
  // Handle sending the message
  const handleSend = async () => {
    if (!message.trim() || !recipientId) return;
    
    try {
      // First create a chat if it doesn't exist
      const chatResponse = await apiRequest('POST', '/api/chats', {
        type: 'direct',
        recipientId,
      });
      
      const chatData = await chatResponse.json();
      const chatId = chatData.chat?.id;
      
      if (!chatId) {
        throw new Error('Failed to create or get chat');
      }
      
      // Now send the message to the chat
      const messageMetadata: any = {};
      
      if (commodityId) {
        messageMetadata.commodityId = commodityId;
        
        // If we have the commodity data, add the name
        if (commoditiesData?.commodities) {
          const commodity = commoditiesData.commodities.find((c: any) => c.id === commodityId);
          if (commodity) {
            messageMetadata.commodityName = commodity.name;
          }
        }
      }
      
      if (selectedTemplate) {
        messageMetadata.templateType = selectedTemplate.templateType;
        messageMetadata.templateId = selectedTemplate.id;
      }
      
      const messageResponse = await apiRequest('POST', `/api/chats/${chatId}/messages`, {
        type: messageType,
        content: message,
        metadata: messageMetadata
      });
      
      const messageData = await messageResponse.json();
      
      // If using a template, update its usage count
      if (selectedTemplate) {
        try {
          await apiRequest('PATCH', `/api/message-templates/${selectedTemplate.id}/usage`, {});
        } catch (err) {
          console.error('Failed to update template usage count', err);
        }
      }
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.'
      });
      
      setMessage('');
      setSelectedTemplate(null);
      
      onSend?.({
        ...messageData,
        chatId,
        recipientId
      });
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Handle template selection
  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessage(template.template);
  };
  
  // Handle creating a new template
  const handleCreateTemplate = () => {
    setIsCreatingTemplate(true);
  };
  
  // Handle editing a template
  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(true);
  };
  
  // Handle deleting a template
  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await apiRequest('DELETE', `/api/message-templates/${templateId}`);
      
      toast({
        title: 'Template deleted',
        description: 'Your message template has been deleted.'
      });
      
      // Refresh templates
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user'] });
      
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setMessage('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Reset state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setSelectedTemplate(null);
      setCurrentTab('template');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Trade Message</DialogTitle>
          <DialogDescription>
            Use templates to create structured commodity trade messages or compose a custom message.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="template">Use Template</TabsTrigger>
            <TabsTrigger value="custom">Custom Message</TabsTrigger>
          </TabsList>
          
          <TabsContent value="template" className="space-y-4">
            {isRecipientLoading ? (
              <div className="space-y-2">
                <AnimatedSkeleton className="h-8 w-full" />
                <AnimatedSkeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Recipient</Label>
                    <div className="flex items-center p-2 border rounded-md h-10">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {recipientData?.name || recipientId || 'Select a recipient'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Commodity</Label>
                    {isCommoditiesLoading ? (
                      <AnimatedSkeleton className="h-10 w-full" />
                    ) : (
                      <div className="flex items-center p-2 border rounded-md h-10">
                        <Coins className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {commodityId && commoditiesData?.commodities ? 
                            commoditiesData.commodities.find((c: any) => c.id === commodityId)?.name || `Commodity #${commodityId}` 
                            : 'No commodity selected'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Select a Message Template</Label>
                  <MessageTemplateSelector
                    userId={userId || 0}
                    onSelect={handleTemplateSelect}
                    onCreateNew={handleCreateTemplate}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                </div>
                
                {selectedTemplate && (
                  <div className="space-y-2">
                    <Label className="mb-2 block">Preview</Label>
                    <div className="border rounded-md p-4 whitespace-pre-wrap min-h-[100px] bg-gray-50">
                      {message}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setMessage('');
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Template
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your trade message here..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onClose?.()}>
              Cancel
            </Button>
            {currentTab === 'template' && !selectedTemplate && (
              <Button variant="outline" onClick={handleCreateTemplate}>
                Create New Template
              </Button>
            )}
          </div>
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || !recipientId}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </DialogFooter>
        
        {/* Template editing dialog */}
        <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
            </DialogHeader>
            <MessageTemplateForm
              userId={userId}
              template={selectedTemplate}
              onSubmit={() => {
                setIsEditingTemplate(false);
                queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user'] });
              }}
              onCancel={() => setIsEditingTemplate(false)}
            />
          </DialogContent>
        </Dialog>
        
        {/* Template creation dialog */}
        <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <MessageTemplateForm
              userId={userId}
              onSubmit={(template) => {
                setIsCreatingTemplate(false);
                queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user'] });
                setSelectedTemplate(template);
                setMessage(template.template);
              }}
              onCancel={() => setIsCreatingTemplate(false)}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
