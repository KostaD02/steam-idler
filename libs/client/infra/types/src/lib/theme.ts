export const ThemeEnum = {
  Light: 'light',
  Dark: 'dark',
} as const;

export type Theme = (typeof ThemeEnum)[keyof typeof ThemeEnum];
