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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomDropdown from '../../components/CustomDropdown';
import * as ImagePicker from 'expo-image-picker';
import { clearAuthMessages, registerUser, fetchRoles, fetchDesignations } from '../../redux/slices/authSlice';
import { wp, hp, ms, fs } from '../../utils/responsive';
import { Image } from 'react-native';

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

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { actionLoading, errorMessage } = useSelector((state) => state.auth);

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
    dispatch(fetchRoles());
    dispatch(fetchDesignations());
  }, [dispatch]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery permissions to upload a photo.');
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
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }

    if (form.password !== form.password_confirmation) {
      Alert.alert('Validation error', 'Password and confirm password must match.');
      return;
    }

    const payload = {
      ...form,
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
      Alert.alert('Success', 'Account created successfully. Please verify your email with the token sent to you.', [
        { text: 'Verify Now', onPress: () => router.replace('/(auth)/verify-email') }
      ]);
      return;
    }

    Alert.alert('Registration failed', action.error?.message || 'Unable to create account.');
  };

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Employee Onboarding</Text>
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
            <Text style={styles.title}>New Employee Account</Text>
            <Text style={styles.description}>
              Please fill in the details below to register a new employee on the Avante Medical LMS. This will create their unique profile and access credentials.
            </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              label="Full Name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChangeText={(val) => updateForm('name', val)}
              leftIcon="person-outline"
              required
            />

            <CustomInput
              label="Email Address"
              placeholder="example@gmail.com"
              value={form.email}
              onChangeText={(val) => updateForm('email', val)}
              keyboardType="email-address"
              leftIcon="mail-outline"
              required
            />

            <CustomInput
              label="Mobile Number"
              placeholder="0000000000"
              value={form.mobile}
              onChangeText={(val) => updateForm('mobile', val)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              required
            />

            <CustomInput
              label="Employee ID"
              placeholder="Emp 123"
              value={form.employee_id}
              onChangeText={(val) => updateForm('employee_id', val)}
              leftIcon="business-outline"
              required
            />

            <CustomDropdown
              label="Designation"
              placeholder={designations.length === 0 ? "Loading designations..." : "Select Designation"}
              options={designations}
              value={form.designation_id}
              onSelect={(val) => updateForm('designation_id', val)}
              required
            />

            <CustomDropdown
              label="Region"
              placeholder="Select Country"
              options={COUNTRIES}
              value={form.region}
              onSelect={(val) => updateForm('region', val)}
              required
            />

            <CustomDropdown
              label="Role"
              placeholder="Select Role"
              options={roles}
              value={form.role_id}
              onSelect={(val) => updateForm('role_id', val)}
              required
            />

            <CustomInput
              label="City"
              placeholder="indore"
              value={form.city}
              onChangeText={(val) => updateForm('city', val)}
              leftIcon="location-outline"
              required
            />

            <CustomInput
              label="Password"
              placeholder="••••••"
              value={form.password}
              onChangeText={(val) => updateForm('password', val)}
              secureTextEntry={true}
              leftIcon="lock-closed-outline"
              required
            />

            <CustomInput
              label="Confirm Password"
              placeholder="••••••"
              value={form.password_confirmation}
              onChangeText={(val) => updateForm('password_confirmation', val)}
              secureTextEntry={true}
              leftIcon="lock-closed-outline"
              required
            />

            {/* Profile Image Section */}
            <View style={styles.profileSection}>
              <Text style={styles.fieldLabel}>Profile Image</Text>
              <View style={styles.profileUploadRow}>
                <View style={styles.avatarWrapper}>
                  {form.profile_image_uri ? (
                    <Image source={{ uri: form.profile_image_uri }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person" size={ms(30)} color="#CBD5E1" />
                  )}
                </View>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={ms(18)} color="#475569" />
                  <Text style={styles.uploadBtnText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.uploadHint}>Supported: JPG, PNG, GIF • Max 5MB</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.registerBtn, actionLoading.register && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={actionLoading.register}
              >
                <Text style={styles.registerBtnText}>
                  {actionLoading.register ? 'Please wait...' : 'Register'}
                </Text>
              </TouchableOpacity>

              {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.alreadyText}>Already have an account?</Text>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.loginBtnText}>Login to your account</Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By creating an account, you agree to Avante Medical's{' '}
                <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
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
  header: {
    backgroundColor: '#24458B',
    paddingBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  introSection: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
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
    backgroundColor: '#00BFA5',
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
    borderColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: hp(10),
  },
  loginBtnText: {
    color: '#00BFA5',
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
    color: '#00BFA5',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(13),
    marginTop: hp(8),
    textAlign: 'center',
  },
});
