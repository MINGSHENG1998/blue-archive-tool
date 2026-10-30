import type { Locale } from '@/constants/i18n';
import type { PlannedReminder, ReminderKind } from './planner';
export type Permission = 'granted' | 'denied' | 'undetermined' | 'unavailable';
export const supported = false;
export const permission = async (): Promise<Permission> => 'unavailable';
export const requestPermission = async (_locale: Locale): Promise<Permission> => 'unavailable';
export const reconcile = async (_wanted: PlannedReminder[], _locale: Locale, _preserveKinds: readonly ReminderKind[] = []) => ({ scheduled: 0, errors: 0 });
export const listen = (_onRoute: (route: string) => void) => () => {};
