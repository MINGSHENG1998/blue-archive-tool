import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useColors } from '@/hooks/useColors';
import { font } from '@/constants/typography';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'cardtitle'  | 'link' | 'small';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const c = useColors();

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'cardtitle' ? styles.cardTitle : undefined,
        type === 'link' ? [styles.link, { color: c.primaryColor }] : undefined,
        type === 'small' ? styles.small : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 12,
    lineHeight: 18,
    ...font('regular'),
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    ...font('regular'),
  },
  smallSemiBold: {
    fontSize: 12,
    lineHeight: 24,
    fontWeight: '600',
    ...font('semibold'),
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    ...font('semibold'),
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 42,
    letterSpacing: -0.5,
    ...font('extrabold'),
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    ...font('bold'),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    ...font('semibold'),
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    ...font('semibold'),
  },
});
