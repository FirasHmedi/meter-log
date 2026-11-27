import type { ReminderResult } from './reminder';

export const remindersAvailable = false;

export async function scheduleMonthlyReminder(_day: number, _previousId: string | null): Promise<ReminderResult> {
  return { ok: false, reason: 'error' };
}

export async function cancelReminder(_id: string | null): Promise<void> {}
