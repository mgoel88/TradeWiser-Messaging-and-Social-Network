import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { PlusCircle, Star, StarOff, Clock, Edit, Trash } from "lucide-react";
import { MessageTemplate } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

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
  onDelete
}: MessageTemplateSelectorProps) {
  const [templateType, setTemplateType] = useState<string>('buy_request');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  const { data: userTemplates, isLoading: isLoadingUserTemplates } = useQuery({
    queryKey: ['/api/message-templates/user', userId, templateType],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/user/${userId}?type=${templateType}`);
      return res.templates;
    },
    enabled: !!userId
  });

  const { data: defaultTemplates, isLoading: isLoadingDefaultTemplates } = useQuery({
    queryKey: ['/api/message-templates/defaults', templateType],
    queryFn: async () => {
      const res = await apiRequest(`/api/message-templates/defaults?type=${templateType}`);
      return res.templates;
    }
  });

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    onSelect(template);
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

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'buy_request':
        return 'Open to Buy';
      case 'sell_offer':
        return 'Offer for Sale';
      case 'negotiation':
        return 'Negotiation';
      case 'custom':
        return 'Custom';
      default:
        return type;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="buy_request" onValueChange={setTemplateType}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="buy_request">Buy Request</TabsTrigger>
          <TabsTrigger value="sell_offer">Sell Offer</TabsTrigger>
          <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        
        {['buy_request', 'sell_offer', 'negotiation', 'custom'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{getTemplateTypeLabel(type)} Templates</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCreateNew}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New</span>
              </Button>
            </div>
            
            {/* My Templates Section */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">My Templates</Label>
              {isLoadingUserTemplates ? (
                <div className="flex items-center justify-center h-24 border rounded-md">
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                </div>
              ) : userTemplates && userTemplates.length > 0 ? (
                <div className="space-y-2">
                  {userTemplates.map((template: MessageTemplate) => (
                    <div 
                      key={template.id} 
                      className={`p-3 border rounded-md hover:border-primary cursor-pointer flex justify-between ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          {template.isFavorite && <Star className="h-4 w-4 text-amber-500" />}
                          <Badge variant="outline" className={getTemplateBadgeColor(template.templateType)}>
                            {getTemplateTypeLabel(template.templateType)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{template.template.substring(0, 60)}...</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Used {template.usageCount} times
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation();
                          onEdit(template);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation();
                          onDelete(template.id);
                        }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 border rounded-md">
                  <p className="text-sm text-muted-foreground">You don't have any {getTemplateTypeLabel(type).toLowerCase()} templates yet</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={onCreateNew}
                    className="mt-1"
                  >
                    Create your first template
                  </Button>
                </div>
              )}
            </div>
            
            {/* Default Templates Section */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Default Templates</Label>
              {isLoadingDefaultTemplates ? (
                <div className="flex items-center justify-center h-24 border rounded-md">
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                </div>
              ) : defaultTemplates && defaultTemplates.length > 0 ? (
                <div className="space-y-2">
                  {defaultTemplates.map((template: MessageTemplate) => (
                    <div 
                      key={template.id} 
                      className={`p-3 border rounded-md hover:border-primary cursor-pointer ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="outline" className={getTemplateBadgeColor(template.templateType)}>
                            Default
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{template.template.substring(0, 60)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 border rounded-md">
                  <p className="text-sm text-muted-foreground">No default templates available</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}