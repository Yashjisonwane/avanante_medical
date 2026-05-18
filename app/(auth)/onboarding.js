import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomDropdown from '../../components/CustomDropdown';
import * as ImagePicker from 'expo-image-picker';
import i18n from '../../i18n';
import { clearAuthMessages, registerUser, fetchRoles, fetchDesignations, setLanguage } from '../../redux/slices/authSlice';
import { wp, hp, ms, fs } from '../../utils/responsive';
import { AppColors } from '../../constants/Theme';
import { Image } from 'react-native';
import * as Device from 'expo-device';
import { getOrGenerateDeviceId } from '../../redux/api/baseApi';

const COUNTRIES = [
  { id: 'USA', name: 'United States' },
  { id: 'CAN', name: 'Canada' },
  { id: 'GBR', name: 'United Kingdom' },
  { id: 'IND', name: 'India' },
  { id: 'AUS', name: 'Australia' },
  { id: 'DEU', name: 'Germany' },
  { id: 'FRA', name: 'France' },
  { id: 'ITA', name: 'Italy' },
  { id: 'ESP', name: 'Spain' },
  { id: 'CHN', name: 'China' },
  { id: 'JPN', name: 'Japan' },
  { id: 'BRA', name: 'Brazil' },
  { id: 'ZAF', name: 'South Africa' },
  { id: 'ARE', name: 'United Arab Emirates' },
  { id: 'SAU', name: 'Saudi Arabia' },
  { id: 'SGP', name: 'Singapore' },
  { id: 'MEX', name: 'Mexico' },
  { id: 'RUS', name: 'Russia' },
  { id: 'KOR', name: 'South Korea' },
  { id: 'NGA', name: 'Nigeria' },
].sort((a, b) => a.name.localeCompare(b.name));

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { actionLoading, errorMessage, language } = useSelector((state) => state.auth);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const changeLanguage = async (code) => {
    await dispatch(setLanguage(code));
    setIsLangModalVisible(false);
  };

  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    mobile: '',
    designation_id: '',
    role_id: '',
    department: '',
    region: '',
    city: '',
    password: '',
    password_confirmation: '',
    profile_image_uri: '',
  });

  const { roles, designations } = useSelector((state) => state.auth);

  React.useEffect(() => {
    dispatch(clearAuthMessages());
    dispatch(fetchRoles());
    dispatch(fetchDesignations());
    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error', 'Error'), t('common.permission_gallery_required', 'Please grant gallery permissions to upload a photo.'));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      updateForm('profile_image_uri', result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    const requiredKeys = [
      'name',
      'email',
      'mobile',
      'designation_id',
      'role_id',
      'region',
      'employee_id',
      'city',
      'password',
      'password_confirmation',
    ];

    const hasMissingField = requiredKeys.some((key) => !String(form[key]).trim());
    if (hasMissingField) {
      Alert.alert(t('common.error', 'Error'), t('common.missing_fields', 'Please fill all required fields.'));
      return;
    }

    if (form.password !== form.password_confirmation) {
      Alert.alert(t('common.error', 'Error'), t('common.password_mismatch', 'Password and confirm password must match.'));
      return;
    }

    const deviceId = await getOrGenerateDeviceId();
    const deviceName = `${Device.brand} ${Device.modelName} (${Platform.OS})`;

    const payload = {
      ...form,
      device_id: deviceId,
      device_name: deviceName,
      device_type: Platform.OS,
      ...(form.profile_image_uri.trim()
        ? {
          profile_image: {
            uri: form.profile_image_uri.trim(),
            name: 'profile.jpg',
            type: 'image/jpeg',
          },
        }
        : {}),
    };

    delete payload.profile_image_uri;

    const action = await dispatch(registerUser(payload));
      if (registerUser.fulfilled.match(action)) {
        dispatch(clearAuthMessages());
        router.replace(`/(auth)/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }

    Alert.alert(t('common.error', 'Error'), action.error?.message || t('auth.registration_failed', 'Unable to create account.'));
  };

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.onboarding_button', 'Complete Employee Onboarding')}</Text>
        </View>
        <View style={styles.languageRow}>
          <TouchableOpacity style={styles.languageSelector} onPress={() => setIsLangModalVisible(true)}>
            <Text style={styles.languageText}>{t('common.select_language', 'Select Language')}:</Text>
            <Text style={styles.languageValue}>{currentLanguage?.native || currentLanguage?.label}</Text>
            <Text style={styles.dropdownIcon}> ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introSection}>
            <Text style={styles.title}>{t('auth.onboarding_title', 'New Employee Account')}</Text>
            <Text style={styles.description}>
              {t('auth.onboarding_desc', 'Please fill in the details below to register a new employee on the Avante Medical LMS. This will create their unique profile and access credentials.')}
            </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              label={t('common.full_name', 'Full Name')}
              placeholder={t('common.full_name', 'Full Name')}
              value={form.name}
              onChangeText={(val) => updateForm('name', val)}
              leftIcon="person-outline"
              required
            />

            <CustomInput
              label={t('common.email', 'Email Address')}
              placeholder={t('auth.email_placeholder', 'example@gmail.com')}
              value={form.email}
              onChangeText={(val) => updateForm('email', val)}
              keyboardType="email-address"
              leftIcon="mail-outline"
              required
            />

            <CustomInput
              label={t('common.mobile', 'Mobile Number')}
              placeholder={t('common.mobile', 'Mobile Number')}
              value={form.mobile}
              onChangeText={(val) => updateForm('mobile', val)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              required
            />

            <CustomInput
              label={t('common.employee_id', 'Employee ID')}
              placeholder={t('common.employee_id', 'Employee ID')}
              value={form.employee_id}
              onChangeText={(val) => updateForm('employee_id', val)}
              leftIcon="business-outline"
              required
            />

            <CustomDropdown
              label={t('common.designation', 'Designation')}
              placeholder={designations.length === 0 ? t('common.loading', 'Loading designations...') : t('common.select_designation', 'Select Designation')}
              options={designations}
              value={form.designation_id}
              onSelect={(val) => updateForm('designation_id', val)}
              required
            />

            <CustomDropdown
              label={t('common.region', 'Region')}
              placeholder={t('common.select_country', 'Select Country')}
              options={COUNTRIES}
              value={form.region}
              onSelect={(val) => updateForm('region', val)}
              required
            />

            <CustomDropdown
              label={t('common.role', 'Role')}
              placeholder={t('common.select_role', 'Select Role')}
              options={roles}
              value={form.role_id}
              onSelect={(val) => updateForm('role_id', val)}
              required
            />

            <CustomInput
              label={t('common.city', 'City')}
              placeholder={t('common.city', 'City')}
              value={form.city}
              onChangeText={(val) => updateForm('city', val)}
              leftIcon="location-outline"
              required
            />

            <CustomInput
              label={t('common.password', 'Password')}
              placeholder={t('common.password', 'Password')}
              value={form.password}
              onChangeText={(val) => updateForm('password', val)}
              secureTextEntry={true}
              leftIcon="lock-closed-outline"
              required
            />

            <CustomInput
              label={t('common.confirm_password', 'Confirm Password')}
              placeholder={t('common.confirm_password', 'Confirm Password')}
              value={form.password_confirmation}
              onChangeText={(val) => updateForm('password_confirmation', val)}
              secureTextEntry={true}
              leftIcon="lock-closed-outline"
              required
            />

            {/* Profile Image Section */}
            <View style={styles.profileSection}>
              <Text style={styles.fieldLabel}>{t('auth.profile_image', 'Profile Image')}</Text>
              <View style={styles.profileUploadRow}>
                <View style={styles.avatarWrapper}>
                  {form.profile_image_uri ? (
                    <Image source={{ uri: form.profile_image_uri }} style={styles.avatar} resizeMode="contain" />
                  ) : (
                    <Ionicons name="person" size={ms(30)} color="#CBD5E1" />
                  )}
                </View>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={ms(18)} color="#475569" />
                  <Text style={styles.uploadBtnText}>{t('auth.upload_photo', 'Upload Photo')}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.uploadHint}>{t('auth.supported_formats', 'Supported: JPG, PNG, GIF • Max 5MB')}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.registerBtn, actionLoading.register && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={actionLoading.register}
              >
                <Text style={styles.registerBtnText}>
                  {actionLoading.register ? t('auth.please_wait', 'Please wait...') : t('auth.register', 'Register')}
                </Text>
              </TouchableOpacity>

              {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.or', 'OR')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.alreadyText}>{t('auth.already_have_account', 'Already have an account?')}</Text>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.loginBtnText}>{t('auth.login_to_account', 'Login to your account')}</Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                {t('auth.terms_agreement', "By creating an account, you agree to Avante Medical's")}{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push({ pathname: '/(auth)/legal', params: { type: 'terms' } })}
                >
                  {t('auth.terms', 'Terms of Service')}
                </Text>{' '}{t('auth.and', 'and')}{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push({ pathname: '/(auth)/legal', params: { type: 'privacy' } })}
                >
                  {t('auth.privacy', 'Privacy Policy')}
                </Text>.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isLangModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsLangModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('common.select_language', 'Select Language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    i18n.language === item.code && styles.modalItemActive,
                  ]}
                  onPress={() => changeLanguage(item.code)}
                >
                  <Text style={[
                    styles.modalItemText,
                    i18n.language === item.code && styles.modalItemTextActive,
                  ]}>
                    {item.native} ({item.label})
                  </Text>
                  {i18n.language === item.code && (
                    <Text style={styles.modalCheckIcon}>✓</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#24458B',
    paddingBottom: hp(25),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(20),
  },
  backButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(10),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: wp(25),
    paddingTop: hp(25),
    paddingBottom: hp(40),
  },
  introSection: {
    marginBottom: hp(25),
  },
  title: {
    fontSize: fs(26),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: hp(10),
  },
  description: {
    fontSize: fs(14),
    color: '#666',
    lineHeight: fs(20),
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: wp(12),
    width: '100%',
  },
  col: {
    flex: 1,
  },
  profileSection: {
    marginTop: hp(5),
    marginBottom: hp(25),
  },
  fieldLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#334155',
    marginBottom: hp(12),
  },
  profileUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(15),
  },
  avatarWrapper: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  languageRow: {
    paddingHorizontal: wp(20),
    paddingTop: hp(10),
    paddingBottom: hp(15),
    backgroundColor: '#24458B',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: hp(8),
    paddingHorizontal: wp(12),
    borderRadius: ms(12),
    alignSelf: 'flex-start',
  },
  languageText: {
    fontSize: fs(12),
    color: '#F8FAFC',
    marginRight: wp(6),
  },
  languageValue: {
    fontSize: fs(13),
    color: '#fff',
    fontWeight: '700',
  },
  dropdownIcon: {
    fontSize: fs(12),
    color: '#fff',
    marginLeft: wp(8),
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(15),
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(15),
    paddingHorizontal: wp(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemActive: {
    backgroundColor: '#f9f9f9',
  },
  modalItemText: {
    fontSize: fs(16),
    color: '#444',
  },
  modalItemTextActive: {
    color: '#24458B',
    fontWeight: '600',
  },
  modalCheckIcon: {
    fontSize: fs(18),
    color: '#24458B',
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: ms(20),
    padding: wp(20),
    maxHeight: '50%',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(15),
    paddingVertical: hp(10),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    gap: wp(8),
  },
  uploadBtnText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#475569',
  },
  uploadHint: {
    fontSize: fs(12),
    color: '#94A3B8',
    marginTop: hp(8),
  },
  buttonContainer: {
    marginTop: hp(10),
    alignItems: 'center',
  },
  registerBtn: {
    backgroundColor: AppColors.primary,
    width: '100%',
    height: hp(55),
    borderRadius: ms(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: fs(16),
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: hp(25),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: wp(15),
    color: '#94A3B8',
    fontSize: fs(12),
    fontWeight: '600',
  },
  alreadyText: {
    fontSize: fs(14),
    color: '#64748B',
    marginBottom: hp(15),
    fontWeight: '500',
  },
  loginBtn: {
    width: '100%',
    height: hp(52),
    borderRadius: ms(8),
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: hp(10),
  },
  loginBtnText: {
    color: AppColors.primary,
    fontSize: fs(15),
    fontWeight: '700',
  },
  termsText: {
    fontSize: fs(12),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: hp(20),
    lineHeight: fs(18),
    paddingHorizontal: wp(20),
  },
  linkText: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(13),
    marginTop: hp(8),
    textAlign: 'center',
  },
});
