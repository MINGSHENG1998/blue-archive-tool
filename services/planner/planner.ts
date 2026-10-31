/** Recruitment ceiling estimates, never an expected luck simulation. Rules: Nexon thread 3560313. */
export type GachaSystem = 'spark' | 'charge';
export type Pool = 'standard' | 'limited';
export type SystemOverride = GachaSystem | 'auto';
export interface RuleConfig { gachaSystem?: GachaSystem; gachaSystemFrom?: string }
export interface PlannerTarget { id: string; name: string; studentId?: number; at: number; pool: Pool; period?: string }
export interface PlannerIncome { id: string; name: string; at: number; pyroxene: number }
export interface PlannerState {
  pyroxene: number; tenTickets: number; singleTickets: number; dailyIncome: number;
  charges: Record<Pool, number>; override: SystemOverride; targets: PlannerTarget[];
  balanceAt: number; incomes: PlannerIncome[]; mileageEstimate: boolean;
}
export const REVAMP_AT = Date.parse('2026-11-10T02:00:00Z');
export const PYROXENE_PER_PULL = 120;
const DAY = 86400000;
const record = (raw: unknown): Record<string, unknown> => raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
export const safeCount = (raw: unknown, max = 10000000) => typeof raw === 'number' && Number.isFinite(raw) ? Math.min(max, Math.max(0, Math.floor(raw))) : 0;
export const normalizeOverride = (raw: unknown): SystemOverride => raw === 'spark' || raw === 'charge' ? raw : 'auto';
export const defaultPlanner = (): PlannerState => ({ pyroxene: 0, tenTickets: 0, singleTickets: 0, dailyIncome: 0, charges: { standard: 0, limited: 0 }, override: 'auto', targets: [], balanceAt: 0, incomes: [], mileageEstimate: false });

export function normalizePlanner(raw: unknown): PlannerState {
  const r = record(raw), charges = record(r.charges), seen = new Set<string>();
  const targets: PlannerTarget[] = [];
  for (const value of Array.isArray(r.targets) ? r.targets : []) {
    const t = record(value);
    if (typeof t.id !== 'string' || !t.id || seen.has(t.id) || typeof t.name !== 'string' || !t.name.trim() || typeof t.at !== 'number' || !Number.isFinite(t.at) || t.at <= 0 || t.at > 8640000000000000 || (t.pool !== 'standard' && t.pool !== 'limited')) continue;
    seen.add(t.id);
    targets.push({ id: t.id.slice(0, 160), name: t.name.slice(0, 120), at: t.at, pool: t.pool, ...(typeof t.period === 'string' ? { period: t.period.slice(0, 160) } : {}), ...(typeof t.studentId === 'number' && t.studentId > 0 ? { studentId: Math.floor(t.studentId) } : {}) });
    if (targets.length >= 100) break;
  }
  const incomeIds = new Set<string>();
  const incomes = (Array.isArray(r.incomes) ? r.incomes : []).flatMap(value => {
    const i = record(value);
    if (typeof i.id !== 'string' || incomeIds.has(i.id) || typeof i.name !== 'string' || typeof i.at !== 'number' || !Number.isFinite(i.at) || i.at <= 0 || i.at > 8640000000000000) return [];
    incomeIds.add(i.id);
    return [{ id: i.id.slice(0, 160), name: i.name.slice(0, 120), at: i.at, pyroxene: safeCount(i.pyroxene) }];
  }).slice(0, 100);
  return { pyroxene: safeCount(r.pyroxene), tenTickets: safeCount(r.tenTickets, 10000), singleTickets: safeCount(r.singleTickets, 100000), dailyIncome: safeCount(r.dailyIncome, 100000), charges: { standard: safeCount(charges.standard, 200), limited: safeCount(charges.limited, 200) }, override: normalizeOverride(r.override), targets, balanceAt: typeof r.balanceAt === 'number' && Number.isFinite(r.balanceAt) && r.balanceAt > 0 && r.balanceAt <= 8640000000000000 ? r.balanceAt : 0, incomes, mileageEstimate: r.mileageEstimate === true };
}

export type Holding = 'pyroxene' | 'tenTickets' | 'singleTickets';

/** Pulls the current holdings buy right now, by source: no income, nothing reserved. */
export function pullsNow(state: Pick<PlannerState, Holding>) {
  const pyroxene = Math.floor(state.pyroxene / PYROXENE_PER_PULL), tenTickets = state.tenTickets * 10, singleTickets = state.singleTickets;
  return { pyroxene, tenTickets, singleTickets, total: pyroxene + tenTickets + singleTickets };
}

/**
 * Holdings are a snapshot of what the player owns at `at`: editing one moves the balance date
 * there, so daily income accrues from the moment the numbers were last true and dated income
 * up to then is treated as already counted. An edit that changes nothing keeps the old date.
 * `at` is taken by the caller so the updater stays pure.
 */
export function setHolding(prev: PlannerState, key: Holding, value: number, at: number): PlannerState {
  const next = normalizePlanner({ ...prev, [key]: value });
  return next[key] === prev[key] ? prev : { ...next, balanceAt: at };
}

/** Date-only config takes effect at Global's 02:00 UTC rotation, not local midnight. */
export function systemAt(at: number, config: RuleConfig = {}, override: SystemOverride = 'auto'): GachaSystem {
  if (override !== 'auto') return override;
  if (config.gachaSystem) {
    const from = config.gachaSystemFrom ? Date.parse(`${config.gachaSystemFrom}T02:00:00Z`) : -Infinity;
    if (Number.isFinite(from) ? at >= from : from === -Infinity) return config.gachaSystem;
    // A scheduled revamp moves the transition itself, not only a label after the default date.
    return 'spark';
  }
  return at >= REVAMP_AT ? 'charge' : 'spark';
}

export interface Projection { target: PlannerTarget; system: GachaSystem; days: number; available: number; allocated: number; needed: number; progress: number; shortfall: number; remaining: number; mileagePulls: number }
/**
 * Reserve each target's full ceiling in chronological/insertion order. Later targets use
 * only what remains, including sub-pull pyroxene. Income accrues once from the current
 * balance date; this is a forecast, never an automatic ledger credit.
 */
export function projectTargets(input: PlannerState, now: number, config: RuleConfig = {}): Projection[] {
  const state = normalizePlanner(input), charges = { ...state.charges };
  const balanceAt = state.balanceAt || now;
  const credited = new Set<string>();
  const mileage = new Map<string, { pulls: number; tickets: number }>();
  let pyro = state.pyroxene, tickets = state.tenTickets * 10 + state.singleTickets, creditedDays = 0;
  return state.targets.map((target, index) => ({ target, index })).sort((a, b) => a.target.at - b.target.at || a.index - b.index).map(({ target }) => {
    const days = Math.max(0, Math.floor((Math.max(now, target.at) - balanceAt) / DAY));
    pyro += (days - creditedDays) * state.dailyIncome;
    creditedDays = days;
    for (const income of state.incomes) if (!credited.has(income.id) && income.at > balanceAt && income.at <= Math.max(now, target.at)) { pyro += income.pyroxene; credited.add(income.id); }
    const system = systemAt(target.at, config, state.override);
    const carried = system === 'charge' ? charges[target.pool] : 0;
    const needed = 200 - carried;
    const available = tickets + Math.floor(pyro / PYROXENE_PER_PULL);
    const period = target.period || String(target.at);
    const rewards = mileage.get(period) || { pulls: 0, tickets: 0 };
    let allocated = 0, mileagePulls = 0;
    while (allocated < needed && (tickets > 0 || pyro >= PYROXENE_PER_PULL || rewards.tickets > 0)) {
      if (rewards.tickets > 0) { rewards.tickets--; mileagePulls++; }
      else if (tickets > 0) tickets--;
      else pyro -= PYROXENE_PER_PULL;
      allocated++;
      if (system === 'charge' && state.mileageEstimate) {
        rewards.pulls++;
        if ([70, 130, 150, 170, 270, 330, 350, 370].includes(rewards.pulls)) rewards.tickets += 10;
      }
    }
    mileage.set(period, rewards);
    const progress = carried + allocated;
    if (system === 'charge') charges[target.pool] = progress >= 200 ? 0 : progress;
    return { target, system, days, available, allocated, needed, progress, shortfall: needed - allocated, remaining: tickets + Math.floor(pyro / PYROXENE_PER_PULL), mileagePulls };
  });
}
