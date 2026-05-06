import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../utils/responsive';
import CustomInput from '../../components/CustomInput';
import { verifyEmail, clearAuthMessages } from '../../redux/slices/authSlice';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { email = 'your registered email', token: tokenFromParams = '' } = useLocalSearchParams();
  const { actionLoading } = useSelector((state) => state.auth);
  const [token, setToken] = useState(tokenFromParams || '');

  // Auto-verify if token is provided in deep link
  React.useEffect(() => {
    if (tokenFromParams) {
      handleVerify(tokenFromParams);
    }
  }, [tokenFromParams]);

  const handleVerify = async (manualToken) => {
    const tokenToVerify = (typeof manualToken === 'string' ? manualToken : token).trim();
    
    if (!tokenToVerify) {
      Alert.alert('Missing Token', 'Please enter the verification token received in your email.');
      return;
    }

    const action = await dispatch(verifyEmail(tokenToVerify));
    if (verifyEmail.fulfilled.match(action)) {
      dispatch(clearAuthMessages());
      Alert.alert('Success', 'Email verified successfully. You can now login.', [
        { text: 'Login Now', onPress: () => router.replace('/(auth)/login') },
      ]);
    } else {
      Alert.alert('Verification Failed', action.error?.message || 'Invalid token. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Verification Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={ms(44)} color="#10B981" />
          </View>

          <Text style={styles.cardTitle}>Verify Your Email</Text>
          <View style={styles.titleUnderline} />

          <Text style={styles.description}>
            We've sent a verification token to your email address:
          </Text>

          <View style={styles.emailPill}>
            <Ionicons name="mail-outline" size={ms(18)} color="#00BFA5" />
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.statusBox}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle-outline" size={ms(18)} color="#2563EB" />
              <Text style={styles.statusTitle}>Token Sent Successfully!</Text>
            </View>
            <Text style={styles.statusDescription}>
              Please enter the 6-digit token below to activate your account.
            </Text>
          </View>

          {/* Token Input */}
          <View style={styles.inputSection}>
            <CustomInput
              label="Verification Token"
              placeholder="Enter token from email"
              value={token}
              onChangeText={setToken}
              keyboardType="number-pad"
              leftIcon="key-outline"
              required
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.verifyBtn, actionLoading.verifyEmail && { opacity: 0.7 }]}
              onPress={handleVerify}
              disabled={actionLoading.verifyEmail}
            >
              {actionLoading.verifyEmail ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify & Proceed</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.loginBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.replace('/(auth)/onboarding')}
          >
            <Ionicons name="arrow-back" size={ms(16)} color="#64748B" />
            <Text style={styles.backBtnText}>Back to Registration</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive email? Check your spam folder</Text>
          <Text style={styles.copyrightText}>
            © 2025 Avante Medical LMS • v2.1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
    paddingBottom: hp(20),
    alignItems: 'center',
  },
  logoSection: {
    marginBottom: hp(25),
    marginTop: hp(10),
  },
  logo: {
    width: wp(220),
    height: hp(55),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    width: '100%',
    padding: wp(25),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  iconCircle: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(15),
  },
  cardTitle: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(8),
  },
  titleUnderline: {
    width: wp(40),
    height: hp(4),
    backgroundColor: '#00BFA5',
    borderRadius: 2,
    marginBottom: hp(20),
  },
  description: {
    fontSize: fs(15),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hp(12),
    lineHeight: fs(22),
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    gap: wp(8),
    marginBottom: hp(20),
  },
  emailText: {
    fontSize: fs(15),
    color: '#00BFA5',
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: ms(12),
    width: '100%',
    padding: wp(16),
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: hp(20),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(6),
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#2563EB',
  },
  statusDescription: {
    fontSize: fs(13),
    color: '#475569',
    textAlign: 'center',
    lineHeight: fs(19),
  },
  inputSection: {
    width: '100%',
    marginBottom: hp(10),
  },
  buttonGroup: {
    width: '100%',
    gap: hp(12),
    marginBottom: hp(20),
  },
  verifyBtn: {
    backgroundColor: '#00BFA5',
    height: hp(55),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#F8FAFC',
    height: hp(55),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginBtnText: {
    color: '#64748B',
    fontSize: fs(16),
    fontWeight: '700',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  backBtnText: {
    color: '#64748B',
    fontSize: fs(14),
    fontWeight: '600',
  },
  footer: {
    marginTop: hp(20),
    alignItems: 'center',
  },
  footerText: {
    fontSize: fs(12),
    color: '#64748B',
    marginBottom: hp(4),
  },
  copyrightText: {
    fontSize: fs(11),
    color: '#94A3B8',
    textAlign: 'center',
  },
});
