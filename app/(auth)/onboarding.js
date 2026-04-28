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
import { clearAuthMessages, registerUser } from '../../redux/slices/authSlice';

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
    department: '',
    region: '',
    city: '',
    password: '',
    password_confirmation: '',
    profile_image_uri: '',
  });

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const requiredKeys = [
      'name',
      'email',
      'mobile',
      'designation_id',
      'region',
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
              label="Employee ID (Optional)"
              placeholder="e.g. EMP-12345"
              value={form.employee_id}
              onChangeText={(val) => updateForm('employee_id', val)}
            />

            <CustomInput
              label="Full Name"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={form.name}
              onChangeText={(val) => updateForm('name', val)}
            />

            <CustomInput
              label="Email Address"
              placeholder="sarah.jenkins@avantemedical.com"
              value={form.email}
              onChangeText={(val) => updateForm('email', val)}
              keyboardType="email-address"
            />

            <CustomInput
              label="Designation ID"
              placeholder="e.g. 1"
              value={form.designation_id}
              onChangeText={(val) => updateForm('designation_id', val)}
            />

            <CustomInput
              label="Mobile Number"
              placeholder="e.g. 9516298875"
              value={form.mobile}
              onChangeText={(val) => updateForm('mobile', val)}
              keyboardType="phone-pad"
            />

            <CustomInput
              label="Region"
              placeholder="e.g. north"
              value={form.region}
              onChangeText={(val) => updateForm('region', val)}
            />

            <CustomInput
              label="Department (Optional)"
              placeholder="e.g. Sales"
              value={form.department}
              onChangeText={(val) => updateForm('department', val)}
            />

            <CustomInput
              label="City (Optional)"
              placeholder="e.g. Indore"
              value={form.city}
              onChangeText={(val) => updateForm('city', val)}
            />

            <CustomInput
              label="Profile Image URI (Optional)"
              placeholder="file:///.../profile.jpg"
              value={form.profile_image_uri}
              onChangeText={(val) => updateForm('profile_image_uri', val)}
            />

            <CustomInput
              label="Create Password"
              placeholder="••••••••"
              value={form.password}
              onChangeText={(val) => updateForm('password', val)}
              secureTextEntry={true}
            />

            <CustomInput
              label="Confirm Password"
              placeholder="••••••••"
              value={form.password_confirmation}
              onChangeText={(val) => updateForm('password_confirmation', val)}
              secureTextEntry={true}
            />

            <View style={styles.buttonContainer}>
              <CustomButton
                title={actionLoading.register ? 'Please wait...' : 'Create Account'}
                onPress={handleRegister}
                disabled={actionLoading.register}
              />
              {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}
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
  buttonContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    color: '#24458B',
    fontWeight: '600',
    textDecorationLine: 'none',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginTop: 6,
  },
});
