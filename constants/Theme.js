/**
 * Avante Medical - Centralized Color System
 * All colors used across the application are defined here.
 * Import AppColors in any screen/component to use dynamically.
 */

export const AppColors = {
  // ─── Primary Colors ─────────────────────────────────
  primaryDark: '#1E3A8A',     // Dark Blue - Headers, Primary backgrounds
  primary: '#2563EB',         // Blue - Buttons, Links, Active states
  
  // ─── Accent / Teal ──────────────────────────────────
  teal: '#14B8A6',            // Teal - Success buttons, Progress bars, CTAs
  
  // ─── Background Colors ──────────────────────────────
  backgroundLight: '#F1F5F9', // Light Gray - Screen backgrounds
  backgroundWhite: '#FFFFFF', // White - Cards, Inputs
  
  // ─── Text Colors ────────────────────────────────────
  textDark: '#0F172A',        // Dark Navy - Headings, Primary text
  textSecondary: '#64748B',   // Slate Gray - Subtitles, Secondary text
  textWhite: '#FFFFFF',       // White text on dark backgrounds
  
  // ─── Status Colors ──────────────────────────────────
  success: '#22C55E',         // Green - Completed, Success states
  warning: '#F59E0B',         // Amber - Warning, Skip, Pending states
  danger: '#EF4444',          // Red - Error, Logout, Delete
  
  // ─── Derived / Utility Colors ───────────────────────
  border: '#E2E8F0',          // Light border color
  inputBorder: '#CBD5E1',     // Input field borders
  placeholder: '#94A3B8',     // Placeholder text
  disabled: '#E2E8F0',       // Disabled state
  cardShadow: '#0F172A',      // Shadow color
  
  // ─── Badges & Highlights ────────────────────────────
  badgeSuccessBg: '#DCFCE7',  // Light green badge background
  badgeDangerBg: '#FEE2E2',   // Light red badge background
  badgeWarningBg: '#FEF3C7',  // Light amber badge background
  badgePrimaryBg: '#DBEAFE',  // Light blue badge background
  badgeTealBg: '#CCFBF1',     // Light teal badge background
  
  // ─── Gold / Certificate ─────────────────────────────
  gold: '#F59E0B',            // Gold for certificates, awards
  goldLight: '#FDE68A',       // Light gold
};

export const Colors = {
  primary: AppColors.primaryDark,
  secondary: AppColors.backgroundLight,
  accent: AppColors.danger,
  text: {
    primary: AppColors.textDark,
    secondary: AppColors.textSecondary,
    light: AppColors.placeholder,
    white: AppColors.textWhite,
  },
  border: AppColors.border,
  background: AppColors.backgroundWhite,
  inputBackground: AppColors.backgroundLight,
  success: AppColors.success,
  error: AppColors.danger,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },
};
