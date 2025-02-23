import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
       <Tabs.Screen
        name="banner"
        options={{
          title: 'Banner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="date.fill" color={color} />,
        }}
      />
       <Tabs.Screen
        name="bondExp"
        options={{
          title: 'Bond Exp',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="resourceCalc"
        options={{
          title: 'Chara Builder',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calc.fill" color={color} />,
        }}
      />
       <Tabs.Screen
        name="other"
        options={{
          title: 'Mics',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="mics.fill" color={color} />,
        }}
      />
       {/* <Tabs.Screen
        name="incomeCalc"
        options={{
          title: 'Income Calculator',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="diamond.fill" color={color} />,
        }}
      /> */}
    </Tabs>
  );
}
