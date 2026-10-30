import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Locale } from '@/constants/i18n';
import { reminderStrings } from '@/constants/strings/reminders';
import { fmt } from '@/constants/strings/define';
import { reconcileReminders } from './reconcile';
import { safeReminderRoute, type PlannedReminder, type ReminderKind } from './planner';

const CHANNEL = 'schale-reminders';
export const supported = true;
export type Permission = 'granted' | 'denied' | 'undetermined' | 'unavailable';
export async function permission(): Promise<Permission> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ? 'granted' : p.status;
}
export async function requestPermission(locale: Locale): Promise<Permission> {
  // Android 13 needs the channel to exist before its first permission prompt.
  await prepare(locale);
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return permission();
}
async function prepare(locale: Locale) {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CHANNEL, { name: reminderStrings[locale].channel, importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' });
}
export async function reconcile(wanted: PlannedReminder[], locale: Locale, preserveKinds: readonly ReminderKind[] = []) {
  await prepare(locale);
  const s = reminderStrings[locale];
  return reconcileReminders(wanted.map(r => ({ ...r, signature: `${r.signature}:${locale}` })), {
    list: async () => (await Notifications.getAllScheduledNotificationsAsync()).map(r => ({ id: r.identifier, signature: String(r.content.data?.signature ?? '') })),
    cancel: Notifications.cancelScheduledNotificationAsync,
    schedule: async r => {
      const title = s[`${r.kind}Title`];
      const body = fmt(s[`${r.kind}Body`], { name: r.name });
      await Notifications.scheduleNotificationAsync({ identifier: r.id, content: { title, body, sound: 'default', data: { route: r.route, signature: r.signature } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL } });
    },
  }, preserveKinds);
}
export function listen(onRoute: (route: string) => void): () => void {
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  let alive = true;
  const seen = new Set<string>();
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!response || !alive || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const r = response.notification.request;
    if (seen.has(r.identifier)) return;
    const route = safeReminderRoute(r.identifier, r.content.data?.route);
    if (route) { seen.add(r.identifier); onRoute(route); void Notifications.clearLastNotificationResponseAsync().catch(() => {}); }
  };
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  return () => { alive = false; sub.remove(); };
}
