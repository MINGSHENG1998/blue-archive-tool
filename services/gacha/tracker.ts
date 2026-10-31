import { createJsonStore, readJson, type JsonStore } from '@/services/userdata/storage';
import { normalizeOverride, safeCount, type GachaSystem, type Pool, type SystemOverride } from '@/services/planner/planner';
import type { PullKind } from './session';

export interface TrackedPull { kind: PullKind; pool: Pool; system: GachaSystem }
export interface TrackerState { history: TrackedPull[]; initialCharges: Record<Pool, number>; override: SystemOverride; pool: Pool }
const kinds: PullKind[] = ['miss', 'threeStar', 'pickup'];
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
export const emptyTracker = (): TrackerState => ({ history: [], initialCharges: { standard: 0, limited: 0 }, override: 'auto', pool: 'standard' });
export function normalizeTracker(raw: unknown): TrackerState {
  const r = obj(raw), charges = obj(r.initialCharges);
  return {
    history: (Array.isArray(r.history) ? r.history : []).filter((p): p is TrackedPull => { const v = obj(p); return kinds.includes(v.kind as PullKind) && (v.pool === 'standard' || v.pool === 'limited'); }).map(p => ({ kind: p.kind, pool: p.pool, system: p.system === 'spark' ? 'spark' : 'charge' })),
    initialCharges: { standard: safeCount(charges.standard, 200), limited: safeCount(charges.limited, 200) },
    override: normalizeOverride(r.override), pool: r.pool === 'limited' ? 'limited' : 'standard',
  };
}
export function trackerCharges(state: TrackerState): Record<Pool, number> {
  const charges = { ...state.initialCharges };
  for (const p of state.history) if (p.system === 'charge') charges[p.pool] = p.kind === 'pickup' ? 0 : Math.min(200, charges[p.pool] + 1);
  return charges;
}
export function addTrackedPulls(state: TrackerState, kind: PullKind, pool: Pool, count = 1, system: GachaSystem = 'charge'): TrackerState {
  if (!Number.isFinite(count) || count <= 0) return state;
  return { ...state, history: [...state.history, ...Array.from({ length: Math.min(10, Math.floor(count)) }, () => ({ kind, pool, system }))] };
}
export const undoTrackedPull = (state: TrackerState): TrackerState => ({ ...state, history: state.history.slice(0, -1) });

/** Both gauges (charge guarantee, spark exchange) run out of this many pulls. */
export const GAUGE_MAX = 200;
/** The charge step that guarantees a 3★ (half the gauge). */
export const CHARGE_STEP = 100;

/**
 * The gauge reading for the active rule: the selected pool's charge, or the
 * spark points since the last exchange (a 200th spark pull reads full, the
 * 201st starts the next exchange at 1).
 */
export function trackerProgress(state: TrackerState, system: GachaSystem): number {
  if (system === 'charge') return trackerCharges(state)[state.pool];
  const spark = state.history.filter(p => p.system === 'spark').length;
  return spark === 0 ? 0 : (spark - 1) % GAUGE_MAX + 1;
}

/** Charge sits exactly on a guarantee step: the next pull is the guaranteed one. */
export const atGuarantee = (progress: number, system: GachaSystem) =>
  system === 'charge' && progress > 0 && progress % CHARGE_STEP === 0;

const base = createJsonStore('gacha:v2', normalizeTracker, emptyTracker);
/** Keep v1 intact so upgrading or rolling back never destroys the original session. */
export const trackerStore: JsonStore<TrackerState> = {
  ...base,
  async load() {
    const current = await readJson(base.key);
    if (current.kind === 'unavailable') return { value: emptyTracker(), writable: false };
    if (current.kind === 'value') return { value: normalizeTracker(current.value), writable: true };
    const old = await readJson('gacha:v1:session');
    if (old.kind === 'unavailable') return { value: emptyTracker(), writable: false };
    const history = old.kind === 'value' ? obj(old.value).history : [];
    const migrated = normalizeTracker({ history: (Array.isArray(history) ? history : []).filter(p => kinds.includes(p)).map(kind => ({ kind, pool: 'standard', system: 'spark' })) });
    // The hook persists after the first edit; migration itself is also durable without any taps.
    await base.save(migrated);
    return { value: migrated, writable: true };
  },
};
