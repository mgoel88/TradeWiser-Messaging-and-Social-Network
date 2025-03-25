import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Search, 
  ShoppingCart, 
  Tag, 
  Package, 
  Truck, 
  MessageSquare, 
  Star,
  Users,
  Clock
} from 'lucide-react';
import { MessageTemplateForm } from '@/components/messages/MessageTemplateForm';
import { TradeMessageComposer } from '@/components/messages/TradeMessageComposer';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function TradingTemplatesPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('buy');
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateToEdit, setTemplateToEdit] = useState<any>(null);
  const [messageType, setMessageType] = useState<'buy_request' | 'sell_offer' | 'negotiation'>('buy_request');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user
  const { data: session } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/auth/session');
        return res;
      } catch (err) {
        return { user: null };
      }
    },
  });

  const userId = session?.user?.id;

  // Get user's templates
  const { data: buyTemplates, isLoading: isLoadingBuyTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', userId, 'buy_request'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=buy_request`);
      return res.templates || [];
    },
    enabled: !!userId
  });

  const { data: sellTemplates, isLoading: isLoadingSellTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', userId, 'sell_offer'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=sell_offer`);
      return res.templates || [];
    },
    enabled: !!userId
  });

  const { data: negotiationTemplates, isLoading: isLoadingNegotiationTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', userId, 'negotiation'],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=negotiation`);
      return res.templates || [];
    },
    enabled: !!userId
  });

  // Filtered templates based on search
  const filteredBuyTemplates = buyTemplates?.filter(template => 
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.template.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredSellTemplates = sellTemplates?.filter(template => 
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.template.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredNegotiationTemplates = negotiationTemplates?.filter(template => 
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.template.toLowerCase().includes(search.toLowerCase())
  );

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
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(templateId);
    }
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
        description: "The template has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting template",
        description: "There was an error deleting the template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle sending a message
  const handleSendMessage = (message: any) => {
    toast({
      title: "Message sent",
      description: "Your trade message has been sent successfully.",
    });
  };

  // Determine loading state
  const isLoading = 
    isLoadingBuyTemplates || 
    isLoadingSellTemplates || 
    isLoadingNegotiationTemplates;

  // Get template count by type
  const buyTemplateCount = buyTemplates?.length || 0;
  const sellTemplateCount = sellTemplates?.length || 0;
  const negotiationTemplateCount = negotiationTemplates?.length || 0;

  // Template badge color
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

  // Handle new template click
  const handleNewTemplateClick = (type: 'buy_request' | 'sell_offer' | 'negotiation') => {
    setMessageType(type);
    setTemplateToEdit(null);
    setIsTemplateFormOpen(true);
  };

  // Handle use template click
  const handleUseTemplateClick = (template: any) => {
    setSelectedTemplate(template);
    setMessageType(template.templateType as any);
    setIsComposerOpen(true);
  };

  // Handle edit template click
  const handleEditTemplateClick = (template: any) => {
    setTemplateToEdit(template);
    setIsTemplateFormOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Trading Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage templates for commodity trading messages
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search templates..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>My Trading Templates</CardTitle>
                <CardDescription>
                  Use templates to quickly create buy requests, sell offers, and negotiations
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleNewTemplateClick('buy_request')}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>New Buy Request</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleNewTemplateClick('sell_offer')}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>New Sell Offer</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buy" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="buy" className="relative">
                  Buy Requests
                  {buyTemplateCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {buyTemplateCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sell" className="relative">
                  Sell Offers
                  {sellTemplateCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {sellTemplateCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="negotiation" className="relative">
                  Negotiations
                  {negotiationTemplateCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {negotiationTemplateCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                ) : filteredBuyTemplates && filteredBuyTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBuyTemplates.map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {template.name}
                                {template.isFavorite && <Star className="h-4 w-4 text-amber-500" />}
                              </CardTitle>
                              <CardDescription>
                                Buy Request Template
                              </CardDescription>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getTemplateBadgeColor('buy_request')}
                            >
                              Open to Buy
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <div className="text-sm h-24 overflow-hidden text-ellipsis whitespace-pre-wrap border-l-2 border-muted pl-3">
                              {template.template.substring(0, 200)}
                              {template.template.length > 200 && '...'}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                Used {template.usageCount} times
                              </div>
                              {template.lastUsedAt && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Last used {new Date(template.lastUsedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditTemplateClick(template)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleUseTemplateClick(template)}
                          >
                            Use Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No buy request templates yet</h3>
                    <p className="text-muted-foreground text-center mt-1 mb-4">
                      Create templates to quickly send buy requests to your connections
                    </p>
                    <Button 
                      onClick={() => handleNewTemplateClick('buy_request')}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Your First Template</span>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                ) : filteredSellTemplates && filteredSellTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSellTemplates.map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {template.name}
                                {template.isFavorite && <Star className="h-4 w-4 text-amber-500" />}
                              </CardTitle>
                              <CardDescription>
                                Sell Offer Template
                              </CardDescription>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getTemplateBadgeColor('sell_offer')}
                            >
                              Offer for Sale
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <div className="text-sm h-24 overflow-hidden text-ellipsis whitespace-pre-wrap border-l-2 border-muted pl-3">
                              {template.template.substring(0, 200)}
                              {template.template.length > 200 && '...'}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                Used {template.usageCount} times
                              </div>
                              {template.lastUsedAt && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Last used {new Date(template.lastUsedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditTemplateClick(template)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleUseTemplateClick(template)}
                          >
                            Use Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                    <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No sell offer templates yet</h3>
                    <p className="text-muted-foreground text-center mt-1 mb-4">
                      Create templates to quickly send sell offers to your connections
                    </p>
                    <Button 
                      onClick={() => handleNewTemplateClick('sell_offer')}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Your First Template</span>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="negotiation" className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                ) : filteredNegotiationTemplates && filteredNegotiationTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNegotiationTemplates.map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {template.name}
                                {template.isFavorite && <Star className="h-4 w-4 text-amber-500" />}
                              </CardTitle>
                              <CardDescription>
                                Negotiation Template
                              </CardDescription>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getTemplateBadgeColor('negotiation')}
                            >
                              Negotiation
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <div className="text-sm h-24 overflow-hidden text-ellipsis whitespace-pre-wrap border-l-2 border-muted pl-3">
                              {template.template.substring(0, 200)}
                              {template.template.length > 200 && '...'}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                Used {template.usageCount} times
                              </div>
                              {template.lastUsedAt && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Last used {new Date(template.lastUsedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditTemplateClick(template)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleUseTemplateClick(template)}
                          >
                            Use Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No negotiation templates yet</h3>
                    <p className="text-muted-foreground text-center mt-1 mb-4">
                      Create templates to quickly respond to offers with counter offers
                    </p>
                    <Button 
                      onClick={() => handleNewTemplateClick('negotiation')}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Your First Template</span>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Trading Templates Work</CardTitle>
            <CardDescription>
              Create custom templates for different trading scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <ShoppingCart className="h-10 w-10 text-green-500 mb-2" />
                <h3 className="text-lg font-medium">Buy Requests</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Send "Open to Buy" requests specifying commodity, quality, quantity, price, and delivery terms. 
                  Set tolerance discounts for variations.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <Tag className="h-10 w-10 text-blue-500 mb-2" />
                <h3 className="text-lg font-medium">Sell Offers</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create "Offer for Sale" templates with commodity details, quality specs, 
                  price, payment terms, and available quantities.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <Users className="h-10 w-10 text-amber-500 mb-2" />
                <h3 className="text-lg font-medium">Broadcast Messages</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Send your buy requests or sell offers to multiple connections at once 
                  to maximize your trading opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Form Dialog */}
      {isTemplateFormOpen && (
        <MessageTemplateForm
          isOpen={isTemplateFormOpen}
          onClose={() => setIsTemplateFormOpen(false)}
          userId={userId}
          initialTemplate={templateToEdit}
          onSave={templateToEdit ? updateTemplate : createTemplate}
        />
      )}

      {/* Message Composer Dialog */}
      {isComposerOpen && (
        <TradeMessageComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          userId={userId}
          messageType={messageType}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
}