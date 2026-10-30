import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AppState, PanResponder, type AppStateStatus } from 'react-native';
import NumberInput from '../NumberInput';
import { RangeSelector } from '../RangeSelector';

jest.mock('@/hooks/useColors', () => ({ useColors: () => require('@/constants/theme').THEMES.baBlue.tokens }));

describe('NumberInput interaction safety', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
  it('changes once on a tap and stops after release', () => {
    const onChange = jest.fn();
    const screen = render(<NumberInput label="Pat" value={5} min={0} max={200} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Pat +'));
    fireEvent(screen.getByLabelText('Pat +'), 'pressOut');
    act(() => jest.advanceTimersByTime(2000));
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([6]);
  });
  it('accelerates a held press in whole numbers and clamps the last step', () => {
    const onChange = jest.fn();
    const screen = render(<NumberInput label="Gift" value={0} min={0} max={30} onChange={onChange} />);
    fireEvent(screen.getByLabelText('Gift +'), 'longPress');
    act(() => jest.advanceTimersByTime(1600));
    const values = onChange.mock.calls.map(([value]) => value);
    expect(values.every(Number.isInteger)).toBe(true);
    expect(values.some((value, index) => index > 0 && value - values[index - 1] > 1)).toBe(true);
    act(() => jest.advanceTimersByTime(10000));
    expect(onChange).toHaveBeenLastCalledWith(30);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('cleans up a pending hold when unmounted', () => {
    const onChange = jest.fn();
    const screen = render(<NumberInput label="Gift" value={0} onChange={onChange} />);
    fireEvent(screen.getByLabelText('Gift +'), 'longPress');
    screen.unmount();
    act(() => jest.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('commits manual entries using current bounds', () => {
    const onChange = jest.fn();
    const screen = render(<NumberInput label="Gift" value={5} min={0} max={6} onChange={onChange} />);
    const input = screen.getByLabelText('Gift');
    fireEvent.changeText(input, '999'); fireEvent(input, 'blur');
    expect(onChange).toHaveBeenLastCalledWith(6);
    screen.rerender(<NumberInput label="Gift" value={6} min={0} max={200} onChange={onChange} />);
    fireEvent.changeText(screen.getByLabelText('Gift'), '42'); fireEvent(screen.getByLabelText('Gift'), 'blur');
    expect(onChange).toHaveBeenLastCalledWith(42);
  });
  it('cancels holding when the app leaves the foreground', () => {
    let changed: ((state: AppStateStatus) => void) | undefined;
    const listener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => { changed = callback; return { remove: jest.fn() }; });
    const onChange = jest.fn();
    const screen = render(<NumberInput label="Gift" value={0} onChange={onChange} />);
    fireEvent(screen.getByLabelText('Gift +'), 'longPress');
    act(() => changed?.('background'));
    act(() => jest.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
    screen.unmount(); listener.mockRestore();
  });
});

describe('RangeSelector gestures', () => {
  it('uses thumb-relative drag and current callbacks after props change', () => {
    const responders: any[] = [];
    const create = jest.spyOn(PanResponder, 'create').mockImplementation(config => { responders.push(config); return { panHandlers: {} } as any; });
    const original = jest.fn(), latest = jest.fn();
    const screen = render(<RangeSelector min={1} max={101} low={20} high={90} onChange={original} />);
    fireEvent(screen.getByTestId('range-track'), 'layout', { nativeEvent: { layout: { width: 226 } } });
    screen.rerender(<RangeSelector min={1} max={101} low={20} high={90} onChange={latest} />);
    act(() => { responders[0].onPanResponderGrant(); responders[0].onPanResponderMove({}, { dx: 100, moveX: 900 }); });
    expect(latest).toHaveBeenLastCalledWith(70, 90);
    expect(original).not.toHaveBeenCalled();
    act(() => responders[0].onPanResponderMove({}, { dx: 500, moveX: 900 }));
    expect(latest).toHaveBeenLastCalledWith(90, 90);
    create.mockRestore();
  });
});

