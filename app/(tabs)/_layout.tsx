import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const c = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primaryColor,
        tabBarInactiveTintColor: c.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: c.appBg,
            borderTopColor: c.surfaceBorder,
            borderTopWidth: 1,
            paddingTop: 6,
          },
          default: {
            backgroundColor: c.appBg,
            borderTopColor: c.surfaceBorder,
            borderTopWidth: 1,
            elevation: 20,
            height: 60,
            paddingTop: 6,
            paddingBottom: 8,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
        },
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
          title: 'Misc',
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
