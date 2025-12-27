import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  showNotification,
  notificationPresets
} from '@/lib/notifications';
import type { Booking, Facility } from '@shared/schema';
import { differenceInMilliseconds, addHours, isAfter } from 'date-fns';

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  showBookingReminder: (booking: Booking, facilityName: string) => void;
  showEventReminder: (eventName: string, date: string) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [isSupported] = useState(() => isNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const showBookingReminder = useCallback((booking: Booking, facilityName: string) => {
    if (permission !== 'granted') return;
    
    const options = notificationPresets.bookingReminder(
      facilityName,
      booking.startTime,
      booking.date
    );
    showNotification(options);
  }, [permission]);

  const showEventReminder = useCallback((eventName: string, date: string) => {
    if (permission !== 'granted') return;
    
    const options = notificationPresets.eventReminder(eventName, date);
    showNotification(options);
  }, [permission]);

  return {
    isSupported,
    permission,
    requestPermission,
    showBookingReminder,
    showEventReminder,
  };
}

// Hook that automatically schedules reminders for upcoming bookings
export function useBookingReminders() {
  const { permission } = useNotifications();
  const scheduledTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['/api/bookings/my'],
    enabled: permission === 'granted',
  });

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
    enabled: permission === 'granted',
  });

  useEffect(() => {
    if (permission !== 'granted' || !bookings || !facilities) return;

    const now = new Date();
    const reminderHoursBefore = 1;
    const timers = scheduledTimersRef.current;

    bookings.forEach((booking) => {
      if (booking.status !== 'CONFIRMED') return;
      
      const reminderId = `booking-${booking.id}`;
      if (timers.has(reminderId)) return;

      try {
        const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const reminderTime = addHours(bookingDateTime, -reminderHoursBefore);
        
        if (isAfter(reminderTime, now) && isAfter(bookingDateTime, now)) {
          const delayMs = differenceInMilliseconds(reminderTime, now);
          
          if (delayMs < 24 * 60 * 60 * 1000) {
            const facility = facilities.find(f => f.id === booking.facilityId);
            const facilityName = facility?.name || 'your facility';
            
            const timer = setTimeout(() => {
              showNotification({
                title: 'Upcoming Booking Reminder',
                body: `Your ${facilityName} booking is in ${reminderHoursBefore} hour - ${booking.startTime} today`,
                tag: reminderId,
                requireInteraction: true,
              });
              timers.delete(reminderId);
            }, delayMs);
            
            timers.set(reminderId, timer);
          }
        }
      } catch (e) {
        // Invalid date format, skip
      }
    });

    // Cleanup on unmount or dependency change
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [permission, bookings, facilities]);
}
