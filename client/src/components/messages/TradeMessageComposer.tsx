
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Template } from 'lucide-react';
import { MessageTemplateSelector } from './MessageTemplateSelector';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  isOpen = true,
  onClose,
  userId,
  messageType = 'text',
  recipientId,
  commodityId,
  onSend
}) => {
  const [message, setMessage] = useState('');
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        body: {
          recipientId,
          content: message,
          type: messageType,
          commodityId
        }
      });

      if (response.message) {
        toast({
          title: 'Message sent',
          description: 'Your message has been sent successfully.'
        });
        
        setMessage('');
        onSend?.(response.message);
        onClose?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose?.()}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Send Message</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateSelectorOpen(true)}
            >
              <Template className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isTemplateSelectorOpen && (
          <MessageTemplateSelector
            onSelect={(template) => {
              setMessage(template);
              setIsTemplateSelectorOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
