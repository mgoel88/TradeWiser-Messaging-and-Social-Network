
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    // Send connect message when WebSocket is ready
    if (readyState === 1) {
      sendMessage({ type: 'connect' });
    }
  }, [readyState, sendMessage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h3 className="font-semibold">Real-time Updates</h3>
        <Badge variant={readyState === 1 ? "success" : "secondary"}>
          {readyState === 1 ? "Connected" : "Connecting..."}
        </Badge>
      </div>

      <div className="space-y-2">
        {notifications.map((notif, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
            {notif.priority === 'high' ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="font-medium text-sm">{notif.title}</p>
              <p className="text-sm text-muted-foreground">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
