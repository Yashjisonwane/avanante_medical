import { useEffect } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AppColors } from '../../constants/Theme';
import { hp, wp, ms, fs } from '../../utils/responsive';

export default function TabLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isHydrated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // Helper to determine if a tab should be highlighted
  const isTabActive = (tabName) => {
    if (tabName === 'home') return pathname === '/home' || pathname === '/index' || pathname === '/';
    if (tabName === 'levels') return pathname.startsWith('/levels');
    if (tabName === 'analytics') return pathname.startsWith('/analytics');
    if (tabName === 'assessment') return pathname.startsWith('/assessment');
    if (tabName === 'profile') return pathname.startsWith('/profile');
    return false;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.placeholder,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? hp(88) : hp(70) + (insets.bottom > 0 ? insets.bottom - hp(10) : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : hp(10),
          paddingTop: hp(12),
          backgroundColor: AppColors.backgroundWhite,
          borderTopWidth: 1,
          borderTopColor: AppColors.border,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: fs(11),
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : hp(5),
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isTabActive('home') ? "home" : "home-outline"} size={26} color={isTabActive('home') ? AppColors.primary : color} />
          ),
          tabBarLabelStyle: {
            color: isTabActive('home') ? AppColors.primary : AppColors.placeholder,
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarAllowFontScaling: false,
        }}
      />
      <Tabs.Screen
        name="levels"
        options={{
          title: t('tabs.levels'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isTabActive('levels') ? "book" : "book-outline"} size={26} color={isTabActive('levels') ? AppColors.primary : color} />
          ),
          tabBarLabelStyle: {
            color: isTabActive('levels') ? AppColors.primary : AppColors.placeholder,
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarAllowFontScaling: false,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('tabs.analytics'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isTabActive('analytics') ? "stats-chart" : "stats-chart-outline"} size={26} color={isTabActive('analytics') ? AppColors.primary : color} />
          ),
          tabBarLabelStyle: {
            color: isTabActive('analytics') ? AppColors.primary : AppColors.placeholder,
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarAllowFontScaling: false,
        }}
      />
      <Tabs.Screen
        name="assessment/index"
        options={{
          title: t('tabs.assessment'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isTabActive('assessment') ? "clipboard" : "clipboard-outline"} size={26} color={isTabActive('assessment') ? AppColors.primary : color} />
          ),
          tabBarLabelStyle: {
            color: isTabActive('assessment') ? AppColors.primary : AppColors.placeholder,
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarAllowFontScaling: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isTabActive('profile') ? "person" : "person-outline"} size={26} color={isTabActive('profile') ? AppColors.primary : color} />
          ),
          tabBarLabelStyle: {
            color: isTabActive('profile') ? AppColors.primary : AppColors.placeholder,
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarAllowFontScaling: false,
        }}
      />
    </Tabs>
  );
}
