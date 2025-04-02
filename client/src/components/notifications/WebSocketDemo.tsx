import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WebSocketDemo() {
  const { lastMessage, sendMessage, readyState } = useWebSocket();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;

        if (data.type === 'notification') {
          setNotifications(prev => [data, ...prev].slice(0, 5));

          toast({
            title: data.title,
            description: data.message,
            variant: data.priority === 'high' ? 'destructive' : 'default'
          });
        }
      } catch (err) {
        console.error('Error processing websocket message:', err);
      }
    }
  }, [lastMessage, toast]);

  useEffect(() => {
    if (readyState === 1) {
      sendMessage({ type: 'connect' });
    }
  }, [readyState, sendMessage]);

  const handleCloseNotification = (index) => {
    setNotifications(prevNotifications => prevNotifications.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </h3>
        <Badge variant="secondary">{notifications.length}</Badge>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {notifications.map((notif, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg bg-muted/50 ${notif.priority === 'high' ? 'bg-red-100' : 'bg-green-100'}`}>
              <div className="flex items-center gap-2">
                {notif.priority === 'high' ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notif.title}</h4>
                <p className="text-sm text-muted-foreground">{notif.message}</p>
                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <button onClick={() => handleCloseNotification(i)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}