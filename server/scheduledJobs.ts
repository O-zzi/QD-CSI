import cron from 'node-cron';
import { storage } from './storage';
import { sendEventReminderEmail } from './email';
import { logger } from './logger';

// Track sent reminders to prevent duplicates on same day
// Key: `${eventId}-${userId}-${daysUntil}-${date}`, Value: true
const sentReminders = new Map<string, boolean>();

// Clear tracking daily at midnight to allow next day's reminders
function clearDailyTracking() {
  sentReminders.clear();
  logger.info('[scheduler] Cleared reminder tracking for new day');
}

export function initializeScheduledJobs() {
  logger.info('[scheduler] Initializing scheduled jobs');

  // Run event reminders daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('[scheduler] Running daily event reminder job');
    await sendEventReminders();
  });

  // Clear tracking at midnight
  cron.schedule('0 0 * * *', () => {
    clearDailyTracking();
  });

  logger.info('[scheduler] Scheduled jobs initialized');
}

async function sendEventReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const threeDaysStr = threeDays.toISOString().split('T')[0];

    const events = await storage.getEvents();
    
    for (const event of events) {
      if (!event.scheduleDay || !event.id) continue;
      
      let daysUntil: number | null = null;
      
      if (event.scheduleDay === tomorrowStr) {
        daysUntil = 1;
      } else if (event.scheduleDay === threeDaysStr) {
        daysUntil = 3;
      }
      
      if (daysUntil) {
        const eventId = event.id;
        const registrations = await storage.getEventRegistrations(eventId);
        const approvedRegistrations = registrations.filter(r => r.status === 'APPROVED');
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        for (const reg of approvedRegistrations) {
          if (!reg.userId) continue;
          
          // Check if we've already sent this reminder today
          const trackingKey = `${eventId}-${reg.userId}-${daysUntil}-${todayStr}`;
          if (sentReminders.has(trackingKey)) {
            logger.debug(`[scheduler] Skipping duplicate reminder: ${trackingKey}`);
            continue;
          }
          
          const user = await storage.getUser(reg.userId);
          if (user?.email) {
            try {
              await sendEventReminderEmail(
                { email: user.email, firstName: user.firstName || 'Member' },
                {
                  title: event.title,
                  date: event.scheduleDay,
                  time: event.scheduleTime || 'TBD',
                },
                daysUntil
              );
              // Mark as sent
              sentReminders.set(trackingKey, true);
              logger.info(`[scheduler] Sent reminder for event ${event.id} to user ${user.id}`);
            } catch (err) {
              logger.error(`[scheduler] Failed to send reminder for event ${event.id} to user ${user.id}:`, err);
            }
          }
        }
      }
    }
    
    logger.info('[scheduler] Event reminder job completed');
  } catch (error) {
    logger.error('[scheduler] Error in event reminder job:', error);
  }
}
