import type { TextStyle } from 'react-native';

export const FONTS = {
  header: 'Outfit_700Bold',
  headerBold: 'Outfit_800ExtraBold',
} as const;

export const headerText: TextStyle = {
  fontFamily: FONTS.headerBold,
};

export const navHeaderText: TextStyle = {
  fontFamily: FONTS.header,
};
