// Browser Push Notifications Utility
// Handles permission requests and notification display

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Check current permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

// Show a notification
export const showNotification = (options: NotificationOptions): Notification | null => {
  if (!isNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/favicon.ico',
    tag: options.tag,
    requireInteraction: options.requireInteraction || false,
  });

  if (options.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
};

// Schedule a notification (for in-browser reminders)
export const scheduleNotification = (
  options: NotificationOptions,
  delayMs: number
): NodeJS.Timeout | null => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  return setTimeout(() => {
    showNotification(options);
  }, delayMs);
};

// Notification presets for common scenarios
export const notificationPresets = {
  bookingReminder: (facilityName: string, time: string, date: string) => ({
    title: 'Upcoming Booking Reminder',
    body: `Your ${facilityName} booking is scheduled for ${time} on ${date}`,
    tag: 'booking-reminder',
    requireInteraction: true,
  }),
  
  bookingConfirmed: (facilityName: string) => ({
    title: 'Booking Confirmed',
    body: `Your booking for ${facilityName} has been confirmed!`,
    tag: 'booking-confirmed',
  }),
  
  paymentVerified: (facilityName: string) => ({
    title: 'Payment Verified',
    body: `Your payment for ${facilityName} has been verified`,
    tag: 'payment-verified',
  }),
  
  eventReminder: (eventName: string, date: string) => ({
    title: 'Event Reminder',
    body: `Don't forget: ${eventName} is happening on ${date}`,
    tag: 'event-reminder',
    requireInteraction: true,
  }),
};
