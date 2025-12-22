import { useEffect, useCallback } from 'react';
import { supabase, isSupabaseAuthConfigured } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

type RealtimeChannel = ReturnType<NonNullable<typeof supabase>['channel']>;

export function useBookingsRealtime(facilityId?: string, date?: string) {
  useEffect(() => {
    if (!isSupabaseAuthConfigured() || !supabase) return;
    
    let channel: RealtimeChannel | null = null;
    
    try {
      channel = supabase
        .channel('bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: facilityId ? `facility_id=eq.${facilityId}` : undefined,
          },
          (payload) => {
            console.log('Booking change detected:', payload.eventType);
            
            queryClient.invalidateQueries({ 
              queryKey: ['/api/bookings'],
              exact: false,
            });
            
            if (facilityId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/bookings', facilityId],
                exact: false,
              });
            }
            
            if (date) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/availability'],
                exact: false,
              });
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to setup bookings realtime subscription. Will fall back to manual refresh.', error);
    }

    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [facilityId, date]);
}

export function useNotificationsRealtime(userId?: string) {
  const handleNewNotification = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/notifications'],
      exact: false,
    });
    queryClient.invalidateQueries({ 
      queryKey: ['/api/notifications/unread-count'],
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseAuthConfigured() || !supabase || !userId) return;
    
    let channel: RealtimeChannel | null = null;
    
    try {
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('New notification received:', payload.new);
            handleNewNotification();
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to setup notifications realtime subscription. Will fall back to manual refresh.', error);
    }

    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [userId, handleNewNotification]);
}

export function useEventsRealtime() {
  useEffect(() => {
    if (!isSupabaseAuthConfigured() || !supabase) return;
    
    let channel: RealtimeChannel | null = null;
    
    try {
      channel = supabase
        .channel('events-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
          },
          () => {
            queryClient.invalidateQueries({ 
              queryKey: ['/api/events'],
              exact: false,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_registrations',
          },
          () => {
            queryClient.invalidateQueries({ 
              queryKey: ['/api/events'],
              exact: false,
            });
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to setup events realtime subscription. Will fall back to manual refresh.', error);
    }

    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, []);
}
