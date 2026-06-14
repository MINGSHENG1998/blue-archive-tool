import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';

export function HapticTab(props: BottomTabBarButtonProps) {
  const c = useColors();
  return (
    <PlatformPressable
      {...props}
      // Bounded rectangular ripple that fits the square tab bar and stays inside
      // the button (the default unbounded circle overflowed onto the system nav bar).
      pressColor={c.accentSoft}
      android_ripple={{ borderless: false, color: c.accentSoft }}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
