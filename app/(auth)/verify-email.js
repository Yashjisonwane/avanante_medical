import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { verifyEmail } from '../../redux/slices/authSlice';
import { AppColors } from '../../constants/Theme';
import { wp, hp, ms, fs } from '../../utils/responsive';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setStatus('error');
      setLoading(false);
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      const resultAction = await dispatch(verifyEmail(token));
      if (verifyEmail.fulfilled.match(resultAction)) {
        setStatus('success');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 3000); // Redirect after 3 seconds
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'verifying' && (
          <>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.title}>Verifying Email...</Text>
            <Text style={styles.subtitle}>Please wait while we confirm your account.</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={styles.iconCircleSuccess}>
              <Ionicons name="checkmark-circle" size={ms(60)} color={AppColors.success} />
            </View>
            <Text style={styles.title}>Email Verified Successfully!</Text>
            <Text style={styles.subtitle}>Your account is now active. Redirecting you to login...</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={styles.iconCircleError}>
              <Ionicons name="alert-circle" size={ms(60)} color={AppColors.danger} />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.subtitle}>The link may be expired or invalid. Please try registering again or contact support.</Text>
            <Text style={styles.retryBtn} onPress={() => router.replace('/(auth)/login')}>
              Go to Login
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
  },
  card: {
    backgroundColor: '#fff',
    padding: wp(30),
    borderRadius: ms(20),
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconCircleSuccess: {
    marginBottom: hp(20),
  },
  iconCircleError: {
    marginBottom: hp(20),
  },
  title: {
    fontSize: fs(20),
    fontWeight: '800',
    color: AppColors.textDark,
    textAlign: 'center',
    marginBottom: hp(10),
  },
  subtitle: {
    fontSize: fs(14),
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: fs(20),
  },
  retryBtn: {
    marginTop: hp(25),
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: fs(16),
    textDecorationLine: 'underline',
  },
});
