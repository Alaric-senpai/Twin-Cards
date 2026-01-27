import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: 'hsl(210 20% 98%)', // #F8F9FA
    foreground: 'hsl(222 47% 11%)', // #0F172A
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(222 47% 11%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(222 47% 11%)',
    primary: 'hsl(0 100% 71%)', // #FF6B6B
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(210 40% 96%)',
    secondaryForeground: 'hsl(222 47% 11%)',
    muted: 'hsl(210 40% 96%)',
    mutedForeground: 'hsl(215 16% 47%)',
    accent: 'hsl(0 100% 71%)',
    accentForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    border: 'hsl(214 32% 91%)',
    input: 'hsl(214 32% 91%)',
    ring: 'hsl(0 100% 71%)',
    radius: '0.75rem',
  },
  dark: {
    background: 'hsl(222 47% 11%)', // #0F172A
    foreground: 'hsl(210 20% 98%)', // #F8F9FA
    card: 'hsl(217 33% 18%)', // #1E293B
    cardForeground: 'hsl(210 20% 98%)',
    popover: 'hsl(217 33% 18%)',
    popoverForeground: 'hsl(210 20% 98%)',
    primary: 'hsl(0 100% 71%)', // #FF6B6B
    primaryForeground: 'hsl(222 47% 11%)',
    secondary: 'hsl(217 33% 18%)',
    secondaryForeground: 'hsl(210 20% 98%)',
    muted: 'hsl(217 33% 18%)',
    mutedForeground: 'hsl(215 20% 65%)',
    accent: 'hsl(0 100% 71%)',
    accentForeground: 'hsl(222 47% 11%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    border: 'hsl(217 33% 18%)',
    input: 'hsl(217 33% 18%)',
    ring: 'hsl(0 100% 71%)',
    radius: '0.75rem',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};