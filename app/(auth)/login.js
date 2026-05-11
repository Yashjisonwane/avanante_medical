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
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import i18n from '../../i18n';
import { clearAuthMessages, loginUser, setLanguage } from '../../redux/slices/authSlice';
import * as Device from 'expo-device';
import { registerForPushNotificationsAsync } from '../../utils/notificationHelper';
import { getOrGenerateDeviceId } from '../../redux/api/baseApi';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const dispatch = useDispatch();
  const { actionLoading, errorMessage, language } = useSelector((state) => state.auth);

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = async (code) => {
    await dispatch(setLanguage(code));
    setIsLangModalVisible(false);
  };

  const handleLogin = async () => {
    const trimmedEmail = identifier.trim();

    if (!trimmedEmail || !password) {
      Alert.alert(t('common.error', 'Error'), t('auth.missing_email_password', 'Please enter email and password.'));
      return;
    }

    try {
      // Fetch FCM Token and Device Info
      let fcmToken = null;
      try {
        fcmToken = await registerForPushNotificationsAsync();
        // Don't send placeholder error strings to backend as they trigger unique constraint errors
        if (fcmToken === 'PERMISSION_NOT_GRANTED' || fcmToken === 'TOKEN_FETCH_ERROR' || fcmToken === 'SIMULATOR_NO_TOKEN') {
          fcmToken = null;
        }
      } catch (tokenErr) {
        console.warn('FCM Token error:', tokenErr.message);
      }

      const deviceId = await getOrGenerateDeviceId();
      const deviceName = `${Device.brand} ${Device.modelName} (${Platform.OS})`;

      const loginPayload = {
        email: trimmedEmail,
        password,
        fcm_token: fcmToken,
        device_id: deviceId,
        device_name: deviceName,
        device_type: Platform.OS, // 'android' or 'ios'
      };

      console.log('--- LOGIN ATTEMPT ---');
      let action = await dispatch(loginUser(loginPayload));

      // Handle the "Duplicate entry" backend error specifically
      const errorStr = action.error?.message || '';
      if (loginUser.rejected.match(action) && errorStr.includes('Duplicate entry') && errorStr.includes('fcm_token')) {
        console.log('Detected duplicate FCM token error, retrying login without token...');
        
        // Retry without token to allow the user to login
        const retryPayload = { ...loginPayload, fcm_token: null };
        action = await dispatch(loginUser(retryPayload));
      }

      if (loginUser.fulfilled.match(action)) {
        dispatch(clearAuthMessages());
        router.replace('/(tabs)/home');
        return;
      }

      Alert.alert(t('auth.login_failed', 'Login failed'), action.error?.message || t('auth.registration_failed', 'Unable to login.'));
    } catch (error) {
      Alert.alert(t('auth.login_failed', 'Login failed'), error.message || t('auth.registration_failed', 'Unable to login.'));
    }
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
          {/* Language Selector */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setIsLangModalVisible(true)}
            >
              <Text style={styles.languageText}>{t('common.select_language')}: </Text>
              <Text style={styles.languageValue}>{currentLanguage.nativeLabel}</Text>
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

          {/* Form Section */}
          <View style={styles.form}>
            <CustomInput
              label={t('auth.email_label')}
              placeholder={t('auth.email_placeholder')}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
            />

            <CustomInput
              label={t('auth.password_label')}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              rightElement={
                <TouchableOpacity onPress={() => router.push('/(auth)/forget-password')}>
                  <Text style={styles.forgotText}>{t('common.forgot_password')}</Text>
                </TouchableOpacity>
              }
            />



            <CustomButton
              title={actionLoading.login ? t('auth.please_wait', 'Please wait...') : t('auth.login_button')}
              onPress={handleLogin}
              disabled={actionLoading.login}
            />
            {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.newEmployeeText}>{t('auth.new_employee')}</Text>
            <CustomButton
              title={t('auth.onboarding_button')}
              onPress={() => router.push('/(auth)/onboarding')}
              variant="secondary"
            />
          </View>



        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.secureText}>{t('auth.secure_login')}</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLink}>{t('auth.terms')}</Text></TouchableOpacity>
            <Text style={styles.footerLinkDivider}>  /  </Text>
            <TouchableOpacity><Text style={styles.footerLink}>{t('auth.privacy')}</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Language Modal */}
      <Modal
        visible={isLangModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLangModalVisible(false)}
      >
        <TouchableOpacity
          style={modalStyles.overlay}
          activeOpacity={1}
          onPress={() => setIsLangModalVisible(false)}
        >
          <View style={modalStyles.content}>
            <Text style={modalStyles.title}>{t('common.select_language')}</Text>
            <FlatList
              data={[
                { code: 'en', label: 'English', native: 'English' },
                { code: 'hi', label: 'Hindi', native: 'हिंदी' },
                { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
              ]}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    modalStyles.item,
                    i18n.language === item.code && modalStyles.itemActive
                  ]}
                  onPress={() => changeLanguage(item.code)}
                >
                  <Text style={[
                    modalStyles.itemText,
                    i18n.language === item.code && modalStyles.itemTextActive
                  ]}>
                    {item.native} ({item.label})
                  </Text>
                  {i18n.language === item.code && (
                    <Text style={modalStyles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemActive: {
    backgroundColor: '#f9f9f9',
  },
  itemText: {
    fontSize: 16,
    color: '#444',
  },
  itemTextActive: {
    color: '#24458B',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 18,
    color: '#24458B',
    fontWeight: '700',
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 0,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
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
    backgroundColor: '#fcfcfc',
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
    marginBottom: 20,
  },
  logo: {
    width: 250,
    height: 70,
    marginBottom: 10,
  },
  form: {
    width: '100%',
  },
  forgotText: {
    color: '#24458B',
    fontWeight: '600',
    fontSize: 14,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontWeight: '600',
    fontSize: 12,
  },
  newEmployeeText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 2,
    marginBottom: 15,
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
    marginTop: -2,
    marginBottom: 10,
  },
});
