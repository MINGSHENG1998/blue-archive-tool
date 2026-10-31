// Smoke tests for the calculator screens: each renders its answer with item
// icons from the bundled game data, and the raid screen picks up the boss on now.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { bundledSnapshot } from '@/services/gamedata';
import { i18n } from '@/constants/i18n';
import { calculatorStrings } from '@/constants/strings/calculators';
import { raidCalculatorStrings } from '@/constants/strings/raid-calculator';
import { calculateSkillCost } from '@/constants/skillData';
import { levelPlan } from '@/services/calculators';
import Bond from '@/app/tools/bond';
import Eleph from '@/app/tools/eleph';
import Level from '@/app/tools/level';
import Raid from '@/app/tools/raid';
import Skill from '@/app/tools/skill';

jest.mock('@/hooks/useColors', () => ({ useColors: () => jest.requireActual('@/constants/theme').THEMES.baBlue.tokens }));
jest.mock('@/components/schale/Icon', () => ({ Icon: () => null }));
jest.mock('@/services/ads/InlineAd', () => ({ __esModule: true, default: () => null }));
jest.mock('@/services/ads/interstitial', () => ({ maybeShowCalcInterstitial: jest.fn() }));
jest.mock('@/contexts/ad-free-context', () => ({ useAdFreeContext: () => ({ isAdFree: true }) }));
jest.mock('react-native-reanimated', () => ({ ...jest.requireActual('react-native-reanimated/mock'), useReducedMotion: () => true }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useLocalSearchParams: () => ({}), ErrorBoundary: () => null };
});
const mockItems: Record<string, number> = {};
jest.mock('@/contexts/user-data-context', () => ({
  useInventory: () => ({ ready: true, items: mockItems, get: (key: string) => mockItems[key] ?? 0, set: (key: string, count: number) => { mockItems[key] = count; }, adjust: jest.fn(), setMany: jest.fn() }),
  useWatchlist: () => ({ has: () => false }),
}));
let mockGame: Record<string, unknown> = {};
jest.mock('@/contexts/gamedata-context', () => ({ ...jest.requireActual('@/contexts/gamedata-context'), useGameData: () => mockGame }));

const t = i18n.en, s = calculatorStrings.en, r = raidCalculatorStrings.en;
const snapshot = bundledSnapshot();
function gameWith(config = snapshot.config) {
  const byId = Object.fromEntries(snapshot.students.map(student => [student.Id, student]));
  return {
    students: snapshot.students, byId, config, raids: snapshot.raids, raidNames: undefined, ready: true, source: 'bundled',
    displayName: (student: { Name: string }) => student.Name,
    label: (section: string, key: string) => (snapshot.labels.en as Record<string, Record<string, string>> | undefined)?.[section]?.[key] ?? key,
  };
}

beforeEach(() => { mockGame = gameWith(); for (const key of Object.keys(mockItems)) delete mockItems[key]; });

describe('calculator screens', () => {
  it('level: answer as report and credit tiles, inventory as a bag', () => {
    const screen = render(<Level />);
    expect(screen.getByText(t.bondRequiredExp)).toBeTruthy();
    const plan = levelPlan(1, 90, {})!;
    expect(plan.pinkBooks).toBeGreaterThan(0);
    expect(screen.getByLabelText(`${t.charaExpSuperiorReports} ${plan.pinkBooks.toLocaleString()}`)).toBeTruthy();
    expect(screen.getByLabelText(`${t.charaExpCredits} ${plan.creditsNeeded.toLocaleString()}`)).toBeTruthy();
    // Collapsed, the inventory reads as a bag of icons and counts.
    expect(screen.getByLabelText(`${t.charaExpSuperiorReports} 0`)).toBeTruthy();
    expect(screen.getByText(s.afterItems)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(s.editInventory));
    expect(screen.getByLabelText(t.charaExpNoviceReports)).toBeTruthy();
  });

  it('eleph: needed eleph and eligma tiles, weapon only when ranked', () => {
    const screen = render(<Eleph />);
    expect(screen.getByText(s.elephTotal)).toBeTruthy();
    expect(screen.getByLabelText(`${s.remaining} 330`)).toBeTruthy();
    // The batch pricing keeps its inclusive tier boundaries: 330 eleph cost 1,370, not the table's 1,450.
    expect(screen.getByLabelText(`${s.eligma} 1,370`)).toBeTruthy();
    expect(screen.queryByLabelText(new RegExp(`^${t.elephWeaponUpgradeLabel} \\d`))).toBeNull();
    fireEvent.press(screen.getByLabelText('3★'));
    expect(screen.getByLabelText(`${t.elephWeaponUpgradeLabel} 300`)).toBeTruthy();
  });

  it('skill: credits hero, book tiles, and a skill switched off drops out', () => {
    const screen = render(<Skill />);
    expect(screen.getByText(t.skillTotalCredits)).toBeTruthy();
    const totals = calculateSkillCost({ ex: { current: 1, target: 5 }, skills: [{ current: 1, target: 10 }, { current: 1, target: 10 }, { current: 1, target: 10 }] });
    expect(screen.getByLabelText(`${t.skillBd1} ${totals.bd[0].toLocaleString()}`)).toBeTruthy();
    expect(screen.getByLabelText(`${t.skillSecretNotes} ${totals.secretNotes}`)).toBeTruthy();
    for (const label of [t.skillExLabel, t.skillSkill1, t.skillSkill2, t.skillSkill3]) fireEvent(screen.getByLabelText(`${s.enabled}: ${label}`), 'valueChange', false);
    expect(screen.getByText(s.nothingNeeded)).toBeTruthy();
  });

  it('bond: EXP, time and the gift matrix', () => {
    const screen = render(<Bond />);
    expect(screen.getByText(t.bondRequiredExp)).toBeTruthy();
    expect(screen.getByText(s.gifts)).toBeTruthy();
    expect(screen.getByLabelText(/^Amazing 3★ Gift · 240 Exp: [\d,]+$/)).toBeTruthy();
    expect(screen.getByLabelText(s.patsPerDay)).toBeTruthy();
  });

  it('raid: the boss on now sets its timer, and a clear time becomes a score', () => {
    const config = { ...snapshot.config, regions: snapshot.config.regions.map((region, index) => index === 1 ? { ...region, CurrentRaid: [{ type: 'Raid', raid: 1, start: 0, end: 4102444800 }] } : region) };
    mockGame = gameWith(config as typeof snapshot.config);
    const screen = render(<Raid />);
    expect(screen.getByText(r.onNow)).toBeTruthy();
    expect(screen.getByText('Binah')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '3:00' }).props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.changeText(screen.getByLabelText('Team 1'), '1:00.000');
    // Torment on a 3-minute boss: 2400 x (3600 - 60) + 12,200,000 + 18,876,000.
    expect(screen.getAllByText('39,572,000').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByRole('tab', { name: '4:00' }));
    expect(screen.getByRole('tab', { name: '4:00' }).props.accessibilityState).toMatchObject({ selected: true });
  });
});
