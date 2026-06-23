export const QR_COLORS = {
  light: { dark: '#0a192f', light: '#ffffff' },
  dark: { dark: '#ccd6f6', light: '#112240' },
} as const;

export interface QrRenderOptions {
  color: { dark: string; light: string };
  margin: number;
  width: number;
}

export function getQrRenderOptions(theme?: string): QrRenderOptions {
  return {
    color: theme === 'dark' ? QR_COLORS.dark : QR_COLORS.light,
    margin: 2,
    width: 256,
  };
}
