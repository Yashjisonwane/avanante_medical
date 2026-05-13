import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { verifyEmail } from '../../redux/slices/authSlice';
import { AppColors } from '../../constants/Theme';
import { wp, hp, ms, fs } from '../../utils/responsive';

export default function VerifyEmailScreen() {
  const { token, email } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'

  useEffect(() => {
    if (token) {
      setStatus('verifying');
      handleVerification();
    } else {
      setStatus('pending');
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
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>AVANTE MEDICAL</Text>
      </View>

      <View style={styles.card}>
        {status === 'pending' && (
          <>
            <View style={styles.iconCircleSuccess}>
              <View style={styles.checkInner}>
                <Ionicons name="checkmark" size={ms(35)} color="#10B981" />
              </View>
            </View>

            <Text style={styles.title}>{t('auth.check_email', 'Check Your Email')}</Text>
            <View style={styles.underline} />

            <Text style={styles.subtitle}>
              {t('auth.sent_token_msg', "We've sent a verification token to your email address:")}
            </Text>

            <View style={styles.emailBox}>
              <Ionicons name="mail-outline" size={ms(18)} color="#10B981" />
              <Text style={styles.emailText}>{email || t('auth.your_email', 'your registered email')}</Text>
            </View>

            <View style={styles.statusBox}>
              <View style={styles.statusHeader}>
                <Ionicons name="checkmark-circle-outline" size={ms(16)} color="#2563EB" />
                <Text style={styles.statusTitle}>{t('auth.token_sent_success', 'Token Sent Successfully!')}</Text>
              </View>
              <Text style={styles.statusDesc}>
                {t('auth.mailbox_desc', 'Please check your mailbox and click the verification link to activate your account.')}
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={ms(14)} color="#64748B" />
                <Text style={styles.infoText}>{t('auth.token_expiry', 'Token expires in 10 minutes')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="alert-circle-outline" size={ms(14)} color="#64748B" />
                <Text style={styles.infoText}>{t('auth.spam_check', "Didn't receive email? Check your spam folder")}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.primaryBtnText}>{t('auth.go_to_login', 'Go to Login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.outlineBtn} 
              onPress={() => router.replace('/(auth)/onboarding')}
            >
              <Ionicons name="arrow-back" size={ms(18)} color="#334155" style={{ marginRight: 8 }} />
              <Text style={styles.outlineBtnText}>{t('auth.back_to_registration', 'Back to Registration')}</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'verifying' && (
          <>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={[styles.title, { marginTop: 20 }]}>{t('auth.verifying_email', 'Verifying Email...')}</Text>
            <Text style={styles.subtitle}>{t('auth.verifying_desc', 'Please wait while we confirm your account.')}</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={styles.iconCircleSuccess}>
              <View style={styles.checkInner}>
                <Ionicons name="checkmark" size={ms(35)} color="#10B981" />
              </View>
            </View>
            <Text style={styles.title}>{t('auth.verified_success', 'Email Verified Successfully!')}</Text>
            <Text style={styles.subtitle}>{t('auth.verified_desc', 'Your account is now active. You can now proceed to login.')}</Text>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.primaryBtnText}>{t('auth.go_to_login', 'Go to Login')}</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconCircleSuccess, { borderColor: AppColors.danger }]}>
              <View style={[styles.checkInner, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="close" size={ms(35)} color={AppColors.danger} />
              </View>
            </View>
            <Text style={styles.title}>{status === 'error' && !token ? t('auth.invalid_link', 'Invalid Link') : t('auth.verification_failed', 'Verification Failed')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.verification_error_desc', 'The link may be expired or invalid. Please try registering again or contact support.')}
            </Text>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => router.replace('/(auth)/onboarding')}
            >
              <Text style={styles.primaryBtnText}>{t('auth.back_to_register', 'Back to Registration')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Avante Medical LMS · v2.1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(30),
  },
  logo: {
    width: ms(30),
    height: ms(30),
    marginRight: 10,
  },
  logoText: {
    fontSize: fs(18),
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: wp(24),
    borderRadius: ms(20),
    alignItems: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconCircleSuccess: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    borderWidth: 2,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(20),
  },
  checkInner: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  underline: {
    width: wp(60),
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginTop: hp(8),
    marginBottom: hp(24),
  },
  subtitle: {
    fontSize: fs(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: hp(16),
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderRadius: ms(10),
    marginBottom: hp(24),
  },
  emailText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
  },
  statusBox: {
    backgroundColor: '#EFF6FF',
    width: '100%',
    padding: wp(16),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: hp(24),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  statusTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 6,
  },
  statusDesc: {
    fontSize: fs(13),
    color: '#475569',
    lineHeight: fs(18),
  },
  infoContainer: {
    width: '100%',
    marginBottom: hp(24),
    alignItems: 'center',
    gap: hp(8),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: fs(12),
    color: '#64748B',
    marginLeft: 6,
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: hp(16),
    borderRadius: ms(12),
    alignItems: 'center',
    marginBottom: hp(12),
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fs(16),
    fontWeight: '800',
  },
  outlineBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: hp(16),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  outlineBtnText: {
    color: '#334155',
    fontSize: fs(15),
    fontWeight: '700',
  },
  footer: {
    marginTop: hp(40),
  },
  footerText: {
    fontSize: fs(11),
    color: '#94A3B8',
    textAlign: 'center',
  },
});
