import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progressWidth = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();
  const { isAuthenticated, isHydrated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Start progress animation
    Animated.timing(progressWidth, {
      toValue: 1, // Full width (relative)
      duration: 2500, // Duration matching the splash requirement
      useNativeDriver: false, // We're animating width, so no native driver here
    }).start();

    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      if (!isHydrated) {
        return;
      }
      router.replace(isAuthenticated ? '/(tabs)/home' : '/(auth)/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, progressWidth, isAuthenticated, isHydrated]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <Text style={styles.subtitle}>TRAINING MANAGEMENT SYSTEM</Text> */}
        </View>

        <View style={styles.footer}>
          <View style={styles.loadingTrack}>
            <Animated.View
              style={[
                styles.loadingBar,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
          </View>
          <Text style={styles.footerText}>{t('common.securing_workspace')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: '30%',
  },
  logo: {
    width: 280,
    height: 120,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 2,
    textAlign: 'center',
  },
  footer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 15,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#24458B', // Blue from logo
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  }
});
