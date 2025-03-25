import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedSkeleton } from '@/components/ui/animated-skeleton';
import { Search, PlusCircle, Star, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

interface MessageTemplate {
  id: number;
  userId: number;
  name: string;
  template: string;
  templateType: 'buy_request' | 'sell_offer' | 'negotiation' | 'custom';
  defaultValues: any;
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplateSelectorProps {
  userId: number;
  onSelect: (template: MessageTemplate) => void;
  onCreateNew: () => void;
  onEdit: (template: MessageTemplate) => void;
  onDelete: (templateId: number) => void;
}

export function MessageTemplateSelector({
  userId,
  onSelect,
  onCreateNew,
  onEdit,
  onDelete,
}: MessageTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const [search, setSearch] = useState('');

  // Get user's templates
  const { data: userTemplates, isLoading: isLoadingUserTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', userId],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}`);
      return res.templates || [];
    },
    enabled: !!userId && isOpen,
  });

  // Get default templates
  const { data: defaultTemplates, isLoading: isLoadingDefaultTemplates } = useQuery({
    queryKey: ['/api/message-templates/defaults'],
    queryFn: async () => {
      const res = await apiRequest('/api/message-templates/defaults?type=all');
      return res.templates || [];
    },
    enabled: isOpen,
  });

  // Filter templates based on search
  const filteredUserTemplates = userTemplates?.filter((template: MessageTemplate) => 
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.template.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDefaultTemplates = defaultTemplates?.filter((template: MessageTemplate) => 
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.template.toLowerCase().includes(search.toLowerCase())
  );

  // Handle template selection
  const handleTemplateSelect = (template: MessageTemplate) => {
    onSelect(template);
    setIsOpen(false);
  };

  // Template types and colors
  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'buy_request': return 'Buy Request';
      case 'sell_offer': return 'Sell Offer';
      case 'negotiation': return 'Negotiation';
      case 'custom': return 'Custom';
      default: return type;
    }
  };

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

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Select Template
        </Button>
        <Button onClick={onCreateNew} variant="ghost" size="icon">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Message Template</DialogTitle>
            <DialogDescription>
              Choose a template for your message or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="user">My Templates</TabsTrigger>
                <TabsTrigger value="default">Default Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="space-y-4">
                {isLoadingUserTemplates ? (
                  <div className="space-y-2">
                    <AnimatedSkeleton className="h-20 w-full" />
                    <AnimatedSkeleton className="h-20 w-full" />
                    <AnimatedSkeleton className="h-20 w-full" />
                  </div>
                ) : filteredUserTemplates && filteredUserTemplates.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {filteredUserTemplates.map((template: MessageTemplate) => (
                        <div 
                          key={template.id}
                          className="flex flex-col border rounded-md p-3 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{template.name}</span>
                              {template.isFavorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                            </div>
                            <Badge variant="outline" className={getTemplateBadgeColor(template.templateType)}>
                              {getTemplateTypeLabel(template.templateType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {template.template.substring(0, 120)}
                            {template.template.length > 120 && '...'}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Used {template.usageCount} times</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(template);
                                  setIsOpen(false);
                                }}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this template?')) {
                                    onDelete(template.id);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground mb-4">No templates found</p>
                    <Button onClick={() => {
                      onCreateNew();
                      setIsOpen(false);
                    }}>
                      Create New Template
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="default" className="space-y-4">
                {isLoadingDefaultTemplates ? (
                  <div className="space-y-2">
                    <AnimatedSkeleton className="h-20 w-full" />
                    <AnimatedSkeleton className="h-20 w-full" />
                    <AnimatedSkeleton className="h-20 w-full" />
                  </div>
                ) : filteredDefaultTemplates && filteredDefaultTemplates.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {filteredDefaultTemplates.map((template: MessageTemplate) => (
                        <div 
                          key={template.id}
                          className="flex flex-col border rounded-md p-3 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-medium">{template.name}</span>
                            <Badge variant="outline" className={getTemplateBadgeColor(template.templateType)}>
                              {getTemplateTypeLabel(template.templateType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {template.template.substring(0, 120)}
                            {template.template.length > 120 && '...'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground">No default templates found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              onCreateNew();
              setIsOpen(false);
            }}>
              Create New Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}