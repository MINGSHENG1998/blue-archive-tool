/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { AtkType, DefType, WeaponType } from "@/dto/game.dto";

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const typeColor: Record<AtkType | DefType, { icon: any, background: string }> = {
  explosive: {
    icon: require("@/assets/images/icons/explosive_atk_icon.png"),
    background: "#910008"
  },
  piercing: {
    icon: require("@/assets/images/icons/piercing_atk_icon.png"),
    background: "#BD8802"
  },
  mystic: {
    icon: require("@/assets/images/icons/mystic_atk_icon.png"),
    background: "#4298E0"
  },
  sonic: {
    icon: require("@/assets/images/icons/sonic_atk_icon.png"),
    background: "#94519E"
  },
  light: {
    icon: require("@/assets/images/icons/light_def_icon.png"),
    background: "#910008"
  },
  heavy: {
    icon: require("@/assets/images/icons/heavy_def_icon.png"),
    background: "#BD8802"
  },
  special: {
    icon: require("@/assets/images/icons/special_def_icon.png"),
    background: "#4298E0"
  },
  elastic: {
    icon: require("@/assets/images/icons/elastic_def_icon.png"),
    background: "#94519E"
  }
}