/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { AtkType, DefType } from "@/dto/game.dto";
import { THEMES } from "@/constants/theme";

const dark = THEMES.baBlue.tokens;
const light = THEMES.paper.tokens;

export const Colors = {
  light: {
    text: light.textPrimary,
    background: light.appBg,
    tint: light.primaryColor,
    icon: light.textSecondary,
    tabIconDefault: light.textSecondary,
    tabIconSelected: light.primaryColor,
  },
  dark: {
    text: dark.textPrimary,
    background: dark.appBg,
    tint: dark.primaryColor,
    icon: dark.textSecondary,
    tabIconDefault: dark.textSecondary,
    tabIconSelected: dark.primaryColor,
  },
};

export const typeColor: Record<
  AtkType | DefType,
  { icon: any; background: string }
> = {
  explosive: {
    icon: require("@/assets/images/icons/explosive_atk_icon.png"),
    background: "#910008",
  },
  piercing: {
    icon: require("@/assets/images/icons/piercing_atk_icon.png"),
    background: "#BD8802",
  },
  mystic: {
    icon: require("@/assets/images/icons/mystic_atk_icon.png"),
    background: "#4298E0",
  },
  sonic: {
    icon: require("@/assets/images/icons/sonic_atk_icon.png"),
    background: "#94519E",
  },
  chemical: {
    icon: require("@/assets/images/icons/chemical_atk_icon.png"),
    background: "#11736B",
  },
  light: {
    icon: require("@/assets/images/icons/light_def_icon.png"),
    background: "#910008",
  },
  heavy: {
    icon: require("@/assets/images/icons/heavy_def_icon.png"),
    background: "#BD8802",
  },
  special: {
    icon: require("@/assets/images/icons/special_def_icon.png"),
    background: "#4298E0",
  },
  elastic: {
    icon: require("@/assets/images/icons/elastic_def_icon.png"),
    background: "#94519E",
  },
  composite: {
    icon: require("@/assets/images/icons/composite_def_icon.png"),
    background: "#11736B",
  },
};
