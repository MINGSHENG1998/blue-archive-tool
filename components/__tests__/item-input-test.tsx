import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ItemInput, fitNumberFont } from '@/components/schale/Item';

describe('fitNumberFont', () => {
  test('keeps the full size until the layout width is known', () => {
    expect(fitNumberFont(0, '24600')).toBe(20);
  });
  test('short amounts keep the full size in a phone-width tile', () => {
    expect(fitNumberFont(56, '9840')).toBe(20);
  });
  test('five and six digit amounts shrink so they fit the same tile', () => {
    const five = fitNumberFont(56, '24600');
    const six = fitNumberFont(56, '120000');
    expect(five).toBeLessThan(20);
    expect(six).toBeLessThan(five);
    // Saira's tabular digits are ~0.6em wide; the text must fit the width.
    expect(5 * five * 0.6).toBeLessThanOrEqual(56);
    expect(6 * six * 0.6).toBeLessThanOrEqual(56);
  });
  test('never drops below the readable floor', () => {
    expect(fitNumberFont(20, '1234567890')).toBe(12);
  });
});

test('ItemInput shrinks a 5-digit Pyroxene amount once laid out narrow', () => {
  const { getByLabelText } = render(<ItemInput icon="pyroxene" label="Pyroxene" value={24600} onChange={() => {}} />);
  const input = getByLabelText('Pyroxene');
  expect(StyleSheet.flatten(input.props.style).fontSize).toBe(20);
  fireEvent(input, 'layout', { nativeEvent: { layout: { width: 56, height: 36, x: 0, y: 0 } } });
  expect(StyleSheet.flatten(getByLabelText('Pyroxene').props.style).fontSize).toBeLessThan(20);
});
