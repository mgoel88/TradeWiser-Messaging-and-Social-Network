import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageTemplate } from './MessageTemplateSelector';

interface MessageTemplateFormProps {
  userId?: number;
  template?: MessageTemplate | null;
  onSubmit: (template: MessageTemplate) => void;
  onCancel: () => void;
}

export function MessageTemplateForm({
  userId,
  template,
  onSubmit,
  onCancel
}: MessageTemplateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState(template?.name || '');
  const [templateText, setTemplateText] = useState(template?.template || '');
  const [templateType, setTemplateType] = useState(template?.templateType || 'buy_request');
  const [isFavorite, setIsFavorite] = useState(template?.isFavorite || false);
  
  // Template type options
  const templateTypes = [
    { value: 'buy_request', label: 'Buy Request' },
    { value: 'sell_offer', label: 'Sell Offer' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'contract_proposal', label: 'Contract Proposal' },
    { value: 'contract_accepted', label: 'Contract Accepted' },
    { value: 'custom', label: 'Custom' }
  ];
  
  // Template placeholder suggestions
  const placeholders = [
    { key: '{commodity}', description: 'Commodity name' },
    { key: '{quantity}', description: 'Quantity offered/requested' },
    { key: '{unit}', description: 'Unit of measurement' },
    { key: '{price}', description: 'Price per unit' },
    { key: '{quality}', description: 'Quality specifications' },
    { key: '{location}', description: 'Delivery location' },
    { key: '{delivery_date}', description: 'Delivery date' },
    { key: '{payment_terms}', description: 'Payment terms' }
  ];
  
  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder: string) => {
    setTemplateText((currentText) => {
      return currentText + placeholder;
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !templateText.trim() || !userId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const templateData = {
        userId,
        name,
        template: templateText,
        templateType,
        isFavorite,
        defaultValues: {},
        isDefault: false
      };
      
      let response;
      let responseData;
      
      if (template?.id) {
        // Update existing template
        response = await apiRequest('PUT', `/api/message-templates/${template.id}`, templateData);
        responseData = await response.json();
      } else {
        // Create new template
        response = await apiRequest('POST', '/api/message-templates', templateData);
        responseData = await response.json();
      }
      
      if (responseData) {
        toast({
          title: template?.id ? 'Template updated' : 'Template created',
          description: template?.id 
            ? 'Your message template has been updated successfully.' 
            : 'Your new message template has been created.'
        });
        
        onSubmit(responseData);
      }
    } catch (error) {
      console.error('Template form error:', error);
      toast({
        title: 'Error',
        description: template?.id 
          ? 'Failed to update template. Please try again.' 
          : 'Failed to create template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name *</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Standard Buy Request"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="template-type">Template Type *</Label>
        <Select
          value={templateType}
          onValueChange={setTemplateType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select template type" />
          </SelectTrigger>
          <SelectContent>
            {templateTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="template-text">Template Content *</Label>
          <div className="text-xs text-muted-foreground">
            Insert placeholder:
            <Select onValueChange={insertPlaceholder}>
              <SelectTrigger className="h-7 ml-2 w-40">
                <SelectValue placeholder="Add placeholder" />
              </SelectTrigger>
              <SelectContent>
                {placeholders.map((placeholder) => (
                  <SelectItem key={placeholder.key} value={placeholder.key}>
                    <span className="font-mono text-xs">{placeholder.key}</span>
                    <span className="ml-2 text-muted-foreground">{placeholder.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Textarea
          id="template-text"
          value={templateText}
          onChange={(e) => setTemplateText(e.target.value)}
          placeholder={`Example: I am interested in purchasing {quantity} {unit} of {commodity} at a price of {price}. I need delivery by {delivery_date} to {location}. Please let me know if you can meet these requirements.`}
          className="h-[200px] font-mono text-sm"
          required
        />
        <div className="text-xs text-muted-foreground">
          Use placeholders like {'{commodity}'}, {'{quantity}'}, etc. These will be replaced when sending the message.
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-favorite"
          checked={isFavorite}
          onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
        />
        <Label htmlFor="is-favorite">
          Mark as favorite
        </Label>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {template?.id ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}