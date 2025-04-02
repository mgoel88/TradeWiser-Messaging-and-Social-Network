import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { MessageTemplateSelector } from './MessageTemplateSelector';

export const TradeMessageComposer = () => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    // Send message implementation
    setMessage('');
  };

  return (
    <Card className="p-4">
      <MessageTemplateSelector onSelect={(template) => setMessage(template)} />
      <div className="flex gap-2 mt-4">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};