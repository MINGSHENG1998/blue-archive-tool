import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BannerFile } from '../BannerFile';
import { normalizeBanner } from '@/services/banners/normalize';

const mockRoster = { entries: { '1': { stars: 5, ue: 3, at: 1 } }, owns: (id: number) => id === 1, ready: true, set: jest.fn() };
const mockWatch = { ids: [1], has: (id: number) => id === 1, ready: true, toggle: jest.fn(), setWatched: jest.fn() };
jest.mock('@/contexts/user-data-context', () => ({ useRoster: () => mockRoster, useWatchlist: () => mockWatch }));
jest.mock('@/contexts/gamedata-context', () => ({ useGameData: () => ({ byId: { 1: { Id: 1, LinkedCharacterId: 2 }, 2: { Id: 2, LinkedCharacterId: 1 } }, displayName: () => 'Armed' }) }));
jest.mock('@/contexts/language-context', () => ({ useLanguage: () => ({ locale: 'en' }) }));
jest.mock('@/constants/typography', () => ({ useType: () => ({}) }));
jest.mock('@/hooks/useColors', () => ({ useColors: () => ({}) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/banners', () => jest.requireActual('@/services/banners/select'));
jest.mock('@/components/schale', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  const Button = ({ label, accessibilityLabel, onPress, disabled }: any) => <Pressable accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} disabled={disabled}><Text>{label}</Text></Pressable>;
  return {
    AppCard: ({ children }: any) => <View>{children}</View>,
    PressScale: ({ children, ...props }: any) => <Pressable {...props}>{children}</Pressable>,
    FilterPill: Button, SignalButton: Button,
    SlantPortrait: ({ dimmed, badge }: any) => <View testID="portrait" accessibilityState={{ selected: dimmed }}>{badge}</View>,
    Stamp: ({ label }: any) => <Text>{label}</Text>, Icon: () => null,
  };
});

const banner = normalizeBanner('linked', { startDate: '2026-11-03', endDate: '2026-11-10', type: 'Rerun', characters: [{ studentId: 2, name: 'Armed', rarity: 3 }] })!;

beforeEach(() => jest.clearAllMocks());

it('dims an owned linked form and removes both stored form entries', () => {
  const screen = render(<BannerFile banner={banner} now={Date.parse('2026-10-30')} expanded onToggle={() => {}} />);
  expect(screen.getByTestId('portrait').props.accessibilityState.selected).toBe(true);
  fireEvent.press(screen.getByLabelText('Mark Armed not owned'));
  expect(mockRoster.set.mock.calls).toEqual([[1, null], [2, null]]);
});

it('shows a linked watch and removes it across both forms', () => {
  const screen = render(<BannerFile banner={banner} now={Date.parse('2026-10-30')} expanded onToggle={() => {}} />);
  fireEvent.press(screen.getAllByLabelText('Stop watching Armed')[0], { stopPropagation: jest.fn() });
  expect(mockWatch.setWatched.mock.calls).toEqual([[1, false], [2, false]]);
});
