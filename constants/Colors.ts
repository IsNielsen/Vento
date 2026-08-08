const neonDark = {
  background: '#0D0720',
  surface: '#1A0B4B',
  tint: '#8B5CF6',
  primaryLight: '#A78BFA',
  neonCyan: '#00F5FF',
  neonPink: '#FF0F7B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
} as const;

const Colors = {
  light: neonDark,
  dark: neonDark,
} as const;

export default Colors;
