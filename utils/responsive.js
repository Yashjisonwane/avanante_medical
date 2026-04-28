import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 11 / standard design)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Scale a value based on screen width relative to base design width.
 */
export const wp = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};

/**
 * Scale a value based on screen height relative to base design height.
 */
export const hp = (size) => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(size * scale);
};

/**
 * Moderate scale - less aggressive scaling for fonts, icons, border radius.
 * factor: 0 = no scaling, 1 = full scaling (default 0.5)
 */
export const ms = (size, factor = 0.5) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(newSize);
};

/**
 * Font scale - uses moderate scaling to prevent fonts from becoming too large/small.
 */
export const fs = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const factor = 0.4; // Less aggressive for fonts
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Percentage of screen width
 */
export const widthPercent = (percent) => {
  return (SCREEN_WIDTH * percent) / 100;
};

/**
 * Percentage of screen height
 */
export const heightPercent = (percent) => {
  return (SCREEN_HEIGHT * percent) / 100;
};

/**
 * Check if device is a small screen
 */
export const isSmallDevice = SCREEN_WIDTH < 360;

/**
 * Check if device is a large screen
 */
export const isLargeDevice = SCREEN_WIDTH >= 414;

/**
 * Get accurate safe area spacing (fallback if hook is not available)
 */
export const getStatusBarHeight = () => {
  return Platform.select({
    ios: isLargeDevice ? 44 : 20,
    android: StatusBar.currentHeight || 0,
    default: 0,
  });
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
