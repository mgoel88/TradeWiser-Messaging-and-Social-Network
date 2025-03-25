import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';
import { MessageTemplateForm } from '@/components/messages/MessageTemplateForm';
import { TradeMessageComposer } from '@/components/messages/TradeMessageComposer';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Clock, Send, Search, Filter } from 'lucide-react';

export default function TradingTemplatesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [isMessageComposerOpen, setIsMessageComposerOpen] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<'buy_request' | 'sell_offer' | 'negotiation' | 'custom'>('buy_request');
  const [templateToEdit, setTemplateToEdit] = useState<any>(null);
  const [templateForMessage, setTemplateForMessage] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user session
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const res = await apiRequest('/api/auth/session');
      return res;
    },
  });

  const userId = sessionData?.user?.id;

  // Get all templates
  const { data: allTemplatesData, isLoading: isLoadingAllTemplates } = useQuery({
    queryKey: ['/api/message-templates/user'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}`);
      return res.templates || [];
    },
    enabled: !!userId,
  });

  // Get buy request templates
  const { data: buyRequestTemplatesData, isLoading: isLoadingBuyRequestTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', 'buy_request'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=buy_request`);
      return res.templates || [];
    },
    enabled: !!userId,
  });

  // Get sell offer templates
  const { data: sellOfferTemplatesData, isLoading: isLoadingSellOfferTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', 'sell_offer'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=sell_offer`);
      return res.templates || [];
    },
    enabled: !!userId,
  });

  // Get negotiation templates
  const { data: negotiationTemplatesData, isLoading: isLoadingNegotiationTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', 'negotiation'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=negotiation`);
      return res.templates || [];
    },
    enabled: !!userId,
  });

  // Filter templates based on search query
  const filterTemplates = (templates: any[]) => {
    if (!searchQuery) return templates;
    return templates?.filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.template.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const response = await apiRequest('/api/message-templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Template created',
        description: 'Your template has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user'] });
      setIsTemplateFormOpen(false);
      setTemplateToEdit(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error creating your template',
        variant: 'destructive',
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const response = await apiRequest(`/api/message-templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify(template),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Template updated',
        description: 'Your template has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user'] });
      setIsTemplateFormOpen(false);
      setTemplateToEdit(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error updating your template',
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest(`/api/message-templates/${templateId}`, {
        method: 'DELETE',
      });
      return templateId;
    },
    onSuccess: () => {
      toast({
        title: 'Template deleted',
        description: 'Your template has been deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates/user'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was an error deleting the template',
        variant: 'destructive',
      });
    },
  });

  // Handle create new template
  const handleCreateTemplate = (templateType: 'buy_request' | 'sell_offer' | 'negotiation' | 'custom') => {
    setSelectedTemplateType(templateType);
    setTemplateToEdit(null);
    setIsTemplateFormOpen(true);
  };

  // Handle edit template
  const handleEditTemplate = (template: any) => {
    setTemplateToEdit(template);
    setIsTemplateFormOpen(true);
  };

  // Handle delete template
  const handleDeleteTemplate = (templateId: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  // Handle save template
  const handleSaveTemplate = (template: any) => {
    if (template.id) {
      updateTemplateMutation.mutate(template);
    } else {
      createTemplateMutation.mutate(template);
    }
  };

  // Handle use template for message
  const handleUseTemplate = (template: any) => {
    setTemplateForMessage(template);
    setIsMessageComposerOpen(true);
  };

  // Handle message send
  const handleMessageSend = (message: any) => {
    toast({
      title: 'Message sent',
      description: message.broadcast 
        ? `Broadcasting to ${message.recipientCount} recipients` 
        : 'Your message has been sent',
    });
    setIsMessageComposerOpen(false);
  };

  // Template type badge color
  const getTemplateBadgeColor = (type: string) => {
    switch (type) {
      case 'buy_request':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'sell_offer':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'negotiation':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'custom':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Template card component
  const TemplateCard = ({ template }: { template: any }) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>Last updated: {new Date(template.updatedAt).toLocaleDateString()}</CardDescription>
          </div>
          <Badge variant="outline" className={getTemplateBadgeColor(template.templateType)}>
            {template.templateType === 'buy_request' && 'Buy Request'}
            {template.templateType === 'sell_offer' && 'Sell Offer'}
            {template.templateType === 'negotiation' && 'Negotiation'}
            {template.templateType === 'custom' && 'Custom'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
          {template.template}
        </div>
        <div className="flex items-center mt-4 text-xs text-muted-foreground">
          {template.isFavorite && (
            <div className="flex items-center mr-4">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
              <span>Favorite</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>Used {template.usageCount} times</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2 gap-2">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => handleEditTemplate(template)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-destructive hover:text-destructive"
          onClick={() => handleDeleteTemplate(template.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <Button 
          size="sm"
          onClick={() => handleUseTemplate(template)}
        >
          <Send className="h-4 w-4 mr-1" />
          Use
        </Button>
      </CardFooter>
    </Card>
  );

  // Loading skeleton for templates
  const TemplateLoadingSkeleton = () => (
    <div className="space-y-4">
      <AnimatedSkeleton className="h-48 w-full" />
      <AnimatedSkeleton className="h-48 w-full" />
      <AnimatedSkeleton className="h-48 w-full" />
    </div>
  );

  // Empty state component
  const EmptyState = ({ templateType }: { templateType: string }) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">No templates found</h3>
        <p className="text-muted-foreground">
          {templateType === 'all' 
            ? "You don't have any message templates yet." 
            : `You don't have any ${templateType.replace('_', ' ')} templates yet.`}
        </p>
      </div>
      <Button onClick={() => handleCreateTemplate(templateType as any)}>
        <Plus className="h-4 w-4 mr-2" />
        Create New Template
      </Button>
    </div>
  );

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage templates for trading communications
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button onClick={() => handleCreateTemplate('buy_request')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Buy Request
          </Button>
          <Button onClick={() => handleCreateTemplate('sell_offer')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Sell Offer
          </Button>
          <Button onClick={() => handleCreateTemplate('negotiation')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Negotiation
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-fit">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="buy_request">Buy Requests</TabsTrigger>
          <TabsTrigger value="sell_offer">Sell Offers</TabsTrigger>
          <TabsTrigger value="negotiation">Negotiations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoadingAllTemplates ? (
            <TemplateLoadingSkeleton />
          ) : allTemplatesData && filterTemplates(allTemplatesData).length > 0 ? (
            <div>
              {filterTemplates(allTemplatesData).map((template: any) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <EmptyState templateType="all" />
          )}
        </TabsContent>

        <TabsContent value="buy_request" className="space-y-4">
          {isLoadingBuyRequestTemplates ? (
            <TemplateLoadingSkeleton />
          ) : buyRequestTemplatesData && filterTemplates(buyRequestTemplatesData).length > 0 ? (
            <div>
              {filterTemplates(buyRequestTemplatesData).map((template: any) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <EmptyState templateType="buy_request" />
          )}
        </TabsContent>

        <TabsContent value="sell_offer" className="space-y-4">
          {isLoadingSellOfferTemplates ? (
            <TemplateLoadingSkeleton />
          ) : sellOfferTemplatesData && filterTemplates(sellOfferTemplatesData).length > 0 ? (
            <div>
              {filterTemplates(sellOfferTemplatesData).map((template: any) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <EmptyState templateType="sell_offer" />
          )}
        </TabsContent>

        <TabsContent value="negotiation" className="space-y-4">
          {isLoadingNegotiationTemplates ? (
            <TemplateLoadingSkeleton />
          ) : negotiationTemplatesData && filterTemplates(negotiationTemplatesData).length > 0 ? (
            <div>
              {filterTemplates(negotiationTemplatesData).map((template: any) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <EmptyState templateType="negotiation" />
          )}
        </TabsContent>
      </Tabs>

      {/* Template Form Dialog */}
      {isTemplateFormOpen && (
        <MessageTemplateForm
          isOpen={isTemplateFormOpen}
          onClose={() => {
            setIsTemplateFormOpen(false);
            setTemplateToEdit(null);
          }}
          userId={userId}
          templateType={templateToEdit?.templateType || selectedTemplateType}
          initialTemplate={templateToEdit}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Message Composer Dialog */}
      {isMessageComposerOpen && templateForMessage && (
        <TradeMessageComposer
          isOpen={isMessageComposerOpen}
          onClose={() => {
            setIsMessageComposerOpen(false);
            setTemplateForMessage(null);
          }}
          userId={userId}
          messageType={templateForMessage.templateType}
          onSend={handleMessageSend}
        />
      )}
    </div>
  );
}