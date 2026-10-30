import { defaultPlanner, normalizePlanner, projectTargets, systemAt } from '../planner';

const NOW = Date.parse('2026-10-27T02:00:00Z');
const target = (id: string, days: number, pool: 'standard' | 'limited' = 'standard') => ({ id, name: id, at: NOW + days * 86400000, pool });

describe('recruitment rules and planning', () => {
  it('switches at the Global rotation instant and honors dated config/local override', () => {
    const at = Date.parse('2026-11-10T02:00:00Z');
    expect(systemAt(at - 1)).toBe('spark');
    expect(systemAt(at)).toBe('charge');
    expect(systemAt(at, {}, 'spark')).toBe('spark');
    expect(systemAt(at, { gachaSystem: 'charge', gachaSystemFrom: '2026-12-01' })).toBe('spark');
    expect(systemAt(at, { gachaSystem: 'spark' })).toBe('spark');
  });
  it('never spends one balance on two targets, including targets on the same date', () => {
    const result = projectTargets({ ...defaultPlanner(), pyroxene: 24000, targets: [target('b', 0), target('a', 0)] }, NOW);
    expect(result.map(r => r.allocated)).toEqual([200, 0]);
    expect(result.map(r => r.shortfall)).toEqual([0, 200]);
  });
  it('counts ten-pull tickets, single tickets and only complete days of estimated income', () => {
    const result = projectTargets({ ...defaultPlanner(), pyroxene: 119, tenTickets: 2, singleTickets: 3, dailyIncome: 120, targets: [target('a', 1.9), target('b', 2)] }, NOW);
    expect(result[0].available).toBe(24);
    expect(result[1].available).toBe(1);
  });
  it('keeps Standard and Limited charges separate and clears a pool after budgeted pickup', () => {
    const state = { ...defaultPlanner(), override: 'charge' as const, pyroxene: 24000, charges: { standard: 180, limited: 150 }, targets: [target('a', 0), target('b', 1, 'limited'), target('c', 2)] };
    const result = projectTargets(state, NOW);
    expect(result.map(r => r.needed)).toEqual([20, 50, 200]);
    expect(result.map(r => r.allocated)).toEqual([20, 50, 130]);
    expect(result[2].shortfall).toBe(70);
  });
  it('does not apply carried charges to the old spark system', () => {
    expect(projectTargets({ ...defaultPlanner(), charges: { standard: 199, limited: 199 }, targets: [target('a', 0)] }, NOW)[0].needed).toBe(200);
  });
  it('preserves sub-pull currency and accrues income once across targets', () => {
    const result = projectTargets({ ...defaultPlanner(), override: 'charge', pyroxene: 60, dailyIncome: 60, targets: [target('a', 1), target('b', 2)] }, NOW);
    expect(result.map(r => r.allocated)).toEqual([1, 0]);
    expect(result[1].progress).toBe(1);
  });
  it('rejects bad persisted values, duplicate targets and invalid dates', () => {
    const state = normalizePlanner({ pyroxene: -9, dailyIncome: '999', singleTickets: Infinity, override: 'oops', charges: { standard: 999, limited: -1 }, targets: [target('a', 1), target('a', 1), { id: 'bad', name: 'x', at: NaN, pool: 'standard' }] });
    expect(state.pyroxene).toBe(0);
    expect(state.dailyIncome).toBe(0);
    expect(state.singleTickets).toBe(0);
    expect(state.override).toBe('auto');
    expect(state.charges).toEqual({ standard: 200, limited: 0 });
    expect(state.targets).toHaveLength(1);
  });
  it('rejects a persisted balance date that cannot be rendered as a calendar date', () => {
    expect(normalizePlanner({ balanceAt: Number.MAX_VALUE }).balanceAt).toBe(0);
  });
  it('uses the saved balance date and only credits dated income once', () => {
    const result = projectTargets({ ...defaultPlanner(), balanceAt: NOW, dailyIncome: 120, incomes: [{ id: 'gift', name: 'Gift', at: NOW + 86400000, pyroxene: 120 }], targets: [target('a', 2), target('b', 2)] }, NOW + 86400000);
    expect(result.map(r => r.allocated)).toEqual([3, 0]);
  });
  it('optionally spends earned mileage tickets inside their period only', () => {
    const state = { ...defaultPlanner(), override: 'charge' as const, mileageEstimate: true, singleTickets: 70, targets: [{ ...target('a', 0), period: 'one' }, { ...target('b', 0), period: 'two' }] };
    const result = projectTargets(state, NOW);
    expect(result.map(r => r.allocated)).toEqual([80, 0]);
    expect(result[0].mileagePulls).toBe(10);
    expect(projectTargets({ ...state, mileageEstimate: false }, NOW)[0].allocated).toBe(70);
  });
});
