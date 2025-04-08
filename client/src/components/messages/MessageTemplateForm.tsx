
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, WhatsappIcon } from 'lucide-react';

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
  const [enableWhatsapp, setEnableWhatsapp] = useState(template?.enableWhatsapp || false);
  const [whatsappNumber, setWhatsappNumber] = useState(template?.whatsappNumber || '');
  
  // Commodity specs state
  const [commoditySpecs, setCommoditySpecs] = useState({
    commodity: template?.defaultValues?.commodity || '',
    quality: template?.defaultValues?.quality || '',
    pricePerUnit: template?.defaultValues?.pricePerUnit || '',
    quantity: template?.defaultValues?.quantity || '',
    location: template?.defaultValues?.location || '',
    deliveryTerms: template?.defaultValues?.deliveryTerms || '',
    paymentTerms: template?.defaultValues?.paymentTerms || '',
  });

  // Template type options
  const templateTypes = [
    { value: 'buy_request', label: 'Buy Request' },
    { value: 'sell_offer', label: 'Sell Offer' },
    { value: 'price_quote', label: 'Price Quote Request' },
    { value: 'broadcast', label: 'Broadcast Message' }
  ];

  const handleSpecChange = (field: string, value: string) => {
    setCommoditySpecs(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-update template text based on type
    const specs = { ...commoditySpecs, [field]: value };
    let newText = '';
    
    if (templateType === 'buy_request') {
      newText = `Looking to buy ${specs.commodity}\n\nSpecs:\n- Quality: ${specs.quality}\n- Quantity: ${specs.quantity}\n- Price: ${specs.pricePerUnit}\n- Location: ${specs.location}\n- Delivery: ${specs.deliveryTerms}\n- Payment: ${specs.paymentTerms}\n\nPlease respond with your best offer.`;
    } else if (templateType === 'sell_offer') {
      newText = `Offering ${specs.commodity}\n\nSpecs:\n- Quality: ${specs.quality}\n- Quantity: ${specs.quantity}\n- Price: ${specs.pricePerUnit}\n- Location: ${specs.location}\n- Delivery: ${specs.deliveryTerms}\n- Payment: ${specs.paymentTerms}\n\nInterested buyers please contact.`;
    }
    
    setTemplateText(newText);
  };

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
        enableWhatsapp,
        whatsappNumber,
        defaultValues: commoditySpecs,
        isDefault: false
      };
      
      let response;
      let responseData;
      
      if (template?.id) {
        response = await apiRequest('PUT', `/api/message-templates/${template.id}`, templateData);
        responseData = await response.json();
      } else {
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
      <Tabs defaultValue="specs">
        <TabsList className="w-full">
          <TabsTrigger value="specs">Commodity Specs</TabsTrigger>
          <TabsTrigger value="message">Message</TabsTrigger>
          <TabsTrigger value="sharing">Sharing Options</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Commodity</Label>
              <Input 
                value={commoditySpecs.commodity}
                onChange={(e) => handleSpecChange('commodity', e.target.value)}
                placeholder="e.g. Wheat MP Grade"
              />
            </div>
            <div>
              <Label>Quality Specs</Label>
              <Input 
                value={commoditySpecs.quality}
                onChange={(e) => handleSpecChange('quality', e.target.value)}
                placeholder="e.g. Moisture 12% max"
              />
            </div>
            <div>
              <Label>Price (per unit)</Label>
              <Input 
                value={commoditySpecs.pricePerUnit}
                onChange={(e) => handleSpecChange('pricePerUnit', e.target.value)}
                placeholder="e.g. ₹2500/quintal"
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input 
                value={commoditySpecs.quantity}
                onChange={(e) => handleSpecChange('quantity', e.target.value)}
                placeholder="e.g. 500 quintals"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input 
                value={commoditySpecs.location}
                onChange={(e) => handleSpecChange('location', e.target.value)}
                placeholder="e.g. Indore"
              />
            </div>
            <div>
              <Label>Delivery Terms</Label>
              <Input 
                value={commoditySpecs.deliveryTerms}
                onChange={(e) => handleSpecChange('deliveryTerms', e.target.value)}
                placeholder="e.g. Ex-warehouse"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="message" className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Wheat Buy Request"
            />
          </div>

          <div>
            <Label>Template Type</Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message Template</Label>
            <Textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="min-h-[200px] font-mono"
            />
          </div>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-whatsapp"
              checked={enableWhatsapp}
              onCheckedChange={(checked) => setEnableWhatsapp(checked as boolean)}
            />
            <Label htmlFor="enable-whatsapp">
              Enable WhatsApp Sharing
            </Label>
          </div>

          {enableWhatsapp && (
            <div>
              <Label>WhatsApp Business Number</Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. +919876543210"
              />
            </div>
          )}

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
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4">
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
