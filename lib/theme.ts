import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#F7F7F5',
  surface: '#FFFFFF',
  text: '#111111',
  secondary: '#6B6B6B',
  border: '#E7E7E4',
  muted: '#F1F1EE',
  overlay: 'rgba(17,17,17,0.48)',
  blue: '#2F6FED',
  blueSoft: '#EEF3FF',
  blueDeep: '#1E4FBF',
  green: '#1F9D55',
  greenSoft: '#EAF7EF',
  amber: '#D97706',
  amberSoft: '#FBF3E6',
  red: '#DC3D3D',
  redSoft: '#FDECEC',
  purple: '#7C5CFC',
  purpleSoft: '#F3EFFF',
  mapLand: '#EEF1EA',
  mapRoad: '#D9DCD4',
  mapRoadMajor: '#C9CDC4',
  mapWater: '#D7E4F0',
  asphalt: '#3B3C40',
  asphaltLight: '#4A4B50',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const type = {
  display: {
    fontFamily: font.semibold,
    fontSize: 32,
    letterSpacing: -1.1,
    color: colors.text,
    lineHeight: 38,
  } as TextStyle,
  title: {
    fontFamily: font.semibold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text,
    lineHeight: 28,
  } as TextStyle,
  subtitle: {
    fontFamily: font.medium,
    fontSize: 16,
    letterSpacing: -0.2,
    color: colors.text,
    lineHeight: 22,
  } as TextStyle,
  body: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  } as TextStyle,
  bodyMed: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.secondary,
    lineHeight: 18,
  } as TextStyle,
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.secondary,
  } as TextStyle,
  metric: {
    fontFamily: font.semibold,
    fontSize: 28,
    letterSpacing: -0.8,
    color: colors.text,
  } as TextStyle,
  small: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.secondary,
    lineHeight: 16,
  } as TextStyle,
};

export const shadow = Platform.select({
  web: {
    boxShadow: '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.04)',
  },
  default: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
}) as ViewStyle;

export const shadowSoft = Platform.select({
  web: {
    boxShadow: '0 1px 1px rgba(17,17,17,0.03)',
  },
  default: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
}) as ViewStyle;

export const surface: ViewStyle = {
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: radius.lg,
};

export const severityColor = {
  critical: colors.red,
  moderate: colors.amber,
  low: colors.blue,
  resolved: colors.green,
};

export const severitySoft = {
  critical: colors.redSoft,
  moderate: colors.amberSoft,
  low: colors.blueSoft,
  resolved: colors.greenSoft,
};

export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_DESKTOP = 1024;
