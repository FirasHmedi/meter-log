import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';

const CHANNEL_ID = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const remindersAvailable = true;

export type ReminderResult = { ok: true; id: string } | { ok: false; reason: 'denied' | 'error' };

/** Asks for the permission (only now, when the user turns the reminder on) and schedules it. */
export async function scheduleMonthlyReminder(day: number, previousId: string | null): Promise<ReminderResult> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: t('reminder'),
        importance: AndroidImportance.DEFAULT,
      });
    }
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    await cancelReminder(previousId);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: t('reminderTitle'), body: t('reminderBody') },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day,
        hour: 9,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
    return { ok: true, id };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function cancelReminder(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already gone
  }
}
