import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { clearAuthMessages, verifyEmail } from '../../redux/slices/authSlice';

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token: tokenFromParams = '' } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { actionLoading, errorMessage } = useSelector((state) => state.auth);
  const [token, setToken] = useState(String(tokenFromParams || ''));

  const handleVerifyEmail = async () => {
    const finalToken = token.trim();
    if (!finalToken) {
      Alert.alert('Missing token', 'Please enter the verification token received in your email.');
      return;
    }

    const action = await dispatch(verifyEmail(finalToken));

    if (verifyEmail.fulfilled.match(action)) {
      dispatch(clearAuthMessages());
      Alert.alert('Success', 'Email verified successfully. You can now login.', [
        { text: 'Login Now', onPress: () => router.replace('/(auth)/login') },
      ]);
      return;
    }

    Alert.alert('Verification failed', action.error?.message || 'Unable to verify email.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.languageSelector}>
              <Text style={styles.languageText}>Language: </Text>
              <Text style={styles.languageValue}>English</Text>
              <Text style={styles.dropdownIcon}> ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.pageTitle}>Verify Email</Text>
            <Text style={styles.description}>
              Please enter the verification token sent to your registered email address.
            </Text>

            <CustomInput
              label="Verification Token"
              placeholder="Enter token from email"
              value={token}
              onChangeText={setToken}
            />

            <CustomButton
              title={actionLoading.verifyEmail ? 'Verifying...' : 'Verify Email'}
              onPress={handleVerifyEmail}
              disabled={actionLoading.verifyEmail}
            />
            {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity 
              style={styles.backToLogin}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLinks}>
              <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
              <Text style={styles.footerLinkDivider}>  /  </Text>
              <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
    marginTop: 15,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  languageText: {
    fontSize: 14,
    color: '#666',
  },
  languageValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#999',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 220,
    height: 60,
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  form: {
    width: '100%',
    marginTop: 10,
  },
  backToLogin: {
    marginTop: 20,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#24458B',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 13,
    color: '#777',
    fontWeight: '400',
  },
  footerLinkDivider: {
    color: '#ddd',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
