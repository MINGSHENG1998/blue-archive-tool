import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRootNavigationState } from 'expo-router';
import { useBanners } from './banners-context';
import { useGameData } from './gamedata-context';
import { useLanguage } from './language-context';
import { useAp, useRoster, useWatchlist } from './user-data-context';
import { DEFAULT_REMINDERS, normalizePreferences, planReminders, type ReminderKind, type ReminderPreferences } from '@/services/notifications/planner';
import * as native from '@/services/notifications/native';

const KEY = 'reminders:v1';
interface Value { preferences: ReminderPreferences; ready: boolean; busy: boolean; permission: native.Permission; supported: boolean; scheduled: number; error: boolean; setPreference<K extends keyof ReminderPreferences>(key: K, value: ReminderPreferences[K]): Promise<void>; refresh(): Promise<void> }
const Context = createContext<Value>({ preferences: DEFAULT_REMINDERS, ready: false, busy: false, permission: 'undetermined', supported: native.supported, scheduled: 0, error: false, setPreference: async () => {}, refresh: async () => {} });

/** Mount below language, game data, banners and user-data providers. No launch prompts. */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const { banners, status: bannersStatus } = useBanners();
  const { students, displayName, ready: gameReady } = useGameData();
  const watch = useWatchlist(), roster = useRoster(), ap = useAp();
  const nav = useRootNavigationState();
  const [preferences, setPreferences] = useState<ReminderPreferences>(DEFAULT_REMINDERS);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<native.Permission>('undetermined');
  const [scheduled, setScheduled] = useState(0), [error, setError] = useState(false);
  const asked = useRef(false), mounted = useRef(true), lock = useRef(false);
  const queue = useRef(Promise.resolve());
  const pendingRoute = useRef<string | null>(null);
  const navReady = useRef(false); navReady.current = !!nav?.key;
  const latest = useRef({ preferences, locale, banners, bannersStatus, students, displayName, watch, roster, ap });
  latest.current = { preferences, locale, banners, bannersStatus, students, displayName, watch, roster, ap };
  const hydratedRef = useRef(false), loading = useRef<Promise<void> | null>(null);
  const readPreferences = useCallback(() => {
    if (loading.current) return loading.current;
    loading.current = AsyncStorage.getItem(KEY).then(raw => {
      const data = raw ? JSON.parse(raw) : null;
      asked.current = data?.asked === true;
      if (mounted.current) { setPreferences(normalizePreferences(data?.preferences)); setReady(true); setError(false); }
    }).catch(() => { if (mounted.current) setError(true); }).finally(() => { loading.current = null; });
    return loading.current;
  }, []);
  useEffect(() => {
    mounted.current = true;
    void readPreferences();
    return () => { mounted.current = false; };
  }, [readPreferences]);
  const refresh = useCallback(async () => {
    if (!hydratedRef.current) { await readPreferences(); return; }
    const work = async () => {
      if (!mounted.current || !hydratedRef.current) return;
      try {
        const p = await native.permission();
        const current = latest.current;
        const plan = p === 'granted' ? planReminders({ now: Date.now(), preferences: current.preferences, banners: current.banners.map(b => ({ id: b.id, startAt: b.startAt, endAt: b.endAt, studentIds: b.characters.flatMap(c => c.studentId ? [c.studentId] : []) })), students: current.students.map(s => ({ id: s.Id, name: current.displayName(s), birthday: s.BirthDay, family: s.LinkedCharacterId })), watched: current.watch.ids, owned: Object.keys(current.roster.entries).map(Number), fullAt: current.ap.fullAt() }) : [];
        const preserve: ReminderKind[] = p === 'granted' && current.bannersStatus !== 'ready' ? (['bannerStart','bannerEnd'] as const).filter(kind => current.preferences[kind]) : [];
        const result = await native.reconcile(plan, current.locale, preserve);
        if (mounted.current) { setPermission(p); setScheduled(result.scheduled); setError(result.errors > 0); }
      } catch { if (mounted.current) setError(true); }
    };
    queue.current = queue.current.then(work, work);
    await queue.current;
  }, [readPreferences]);
  const hydrated = ready && gameReady && watch.ready && roster.ready && ap.ready;
  hydratedRef.current = hydrated;
  useEffect(() => {
    if (!hydrated) return;
    void refresh();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    // Renew while kept open; one-shot requests otherwise expire after 14 days.
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 60 * 60 * 1000);
    return () => { sub.remove(); clearInterval(timer); };
  }, [hydrated, preferences, banners, bannersStatus, students, displayName, locale, watch.ids, roster.entries, ap.state, refresh]);
  useEffect(() => native.listen(route => {
    if (navReady.current) router.push(route as never); else pendingRoute.current = route;
  }), []);
  useEffect(() => { if (nav?.key && pendingRoute.current) { const route = pendingRoute.current; pendingRoute.current = null; router.push(route as never); } }, [nav?.key]);
  const setPreference = useCallback(async <K extends keyof ReminderPreferences>(key: K, value: ReminderPreferences[K]) => {
    if (!ready || lock.current || !native.supported) return;
    lock.current = true; setBusy(true); setError(false);
    try {
      let p = await native.permission();
      if (value === true && p !== 'granted' && !asked.current) {
        asked.current = true;
        // Persist before asking so a rejected prompt cannot repeat after restart.
        await AsyncStorage.setItem(KEY, JSON.stringify({ asked: true, preferences: latest.current.preferences }));
        p = await native.requestPermission(latest.current.locale);
      }
      setPermission(p);
      if (value === true && p !== 'granted') return;
      const next = { ...latest.current.preferences, [key]: value };
      await AsyncStorage.setItem(KEY, JSON.stringify({ asked: asked.current, preferences: next }));
      latest.current = { ...latest.current, preferences: next };
      setPreferences(next);
      await refresh();
    } catch { setError(true); } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }, [ready, refresh]);
  return <Context.Provider value={{ preferences, ready, busy, permission, supported: native.supported, scheduled, error, setPreference, refresh }}>{children}</Context.Provider>;
}
export const useReminders = () => useContext(Context);
