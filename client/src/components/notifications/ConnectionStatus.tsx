import { useNotifications } from './NotificationsProvider';
import { WebSocketStatus } from '@/hooks/use-websocket';
import { Badge } from '@/components/ui/badge';

export function ConnectionStatus() {
  const { status } = useNotifications();
  
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  let statusText: string;
  
  switch (status) {
    case WebSocketStatus.OPEN:
      badgeVariant = 'default';
      statusText = 'Connected';
      break;
    case WebSocketStatus.CONNECTING:
      badgeVariant = 'secondary';
      statusText = 'Connecting...';
      break;
    case WebSocketStatus.CLOSING:
      badgeVariant = 'outline';
      statusText = 'Disconnecting...';
      break;
    case WebSocketStatus.CLOSED:
    default:
      badgeVariant = 'destructive';
      statusText = 'Disconnected';
      break;
  }
  
  return (
    <Badge variant={badgeVariant} className="ml-auto">
      <span className={`mr-1 h-2 w-2 rounded-full ${
        status === WebSocketStatus.OPEN ? 'bg-green-500' : 
        status === WebSocketStatus.CONNECTING ? 'bg-yellow-500' :
        'bg-red-500'
      }`} />
      {statusText}
    </Badge>
  );
}