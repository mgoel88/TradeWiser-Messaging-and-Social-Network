import { useNotifications } from './NotificationsProvider';
import { WebSocketStatus } from '@/hooks/use-websocket';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export function ConnectionStatus() {
  const { status, connect } = useNotifications();
  
  // Automatically connect on component mount
  useEffect(() => {
    if (status === WebSocketStatus.CLOSED) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  let badgeVariant: 'default' | 'destructive' | 'outline';
  let statusText: string;
  
  switch (status) {
    case WebSocketStatus.OPEN:
      badgeVariant = 'default';
      statusText = 'Live';
      break;
    case WebSocketStatus.CONNECTING:
      badgeVariant = 'outline';
      statusText = 'Connecting...';
      break;
    case WebSocketStatus.CLOSING:
      badgeVariant = 'outline';
      statusText = 'Disconnecting...';
      break;
    case WebSocketStatus.CLOSED:
    default:
      badgeVariant = 'destructive';
      statusText = 'Offline';
      break;
  }
  
  return (
    <Badge 
      variant={badgeVariant} 
      className="flex items-center h-7 px-2 gap-1.5 text-xs"
      onClick={() => status === WebSocketStatus.CLOSED && connect()}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${
        status === WebSocketStatus.OPEN ? 'bg-green-500 animate-pulse' : 
        status === WebSocketStatus.CONNECTING ? 'bg-yellow-500' :
        'bg-red-500'
      }`} />
      {statusText}
    </Badge>
  );
}