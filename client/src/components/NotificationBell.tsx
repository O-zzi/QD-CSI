import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const unreadCount = unreadData?.count || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-500';
      case 'payment':
        return 'bg-green-500';
      case 'membership':
        return 'bg-purple-500';
      case 'event':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-red-500 rounded-full" data-testid="notification-count">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 group ${!notification.isRead ? 'bg-muted/50' : ''}`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getNotificationIcon(notification.type)}`} />
                    <div className="flex-1 min-w-0">
                      {notification.link ? (
                        <Link href={notification.link} onClick={() => handleNotificationClick(notification)}>
                          <p className="text-sm font-medium cursor-pointer hover:underline">{notification.title}</p>
                        </Link>
                      ) : (
                        <p className="text-sm font-medium">{notification.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-start gap-1 invisible group-hover:visible">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          disabled={markReadMutation.isPending}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-destructive"
                        onClick={() => deleteMutation.mutate(notification.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-notification-${notification.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Link href="/profile?tab=notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-xs h-8" data-testid="button-view-all-notifications">
              View all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
