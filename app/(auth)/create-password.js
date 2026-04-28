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
import { clearAuthMessages, resetPassword } from '../../redux/slices/authSlice';

export default function CreatePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token: tokenFromParams = '' } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { actionLoading, errorMessage } = useSelector((state) => state.auth);
  const [token, setToken] = useState(String(tokenFromParams || ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = async () => {
    const finalToken = token.trim();
    if (!finalToken || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Token, password and confirm password are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation error', 'Password and confirm password must match.');
      return;
    }

    const action = await dispatch(
      resetPassword({
        token: finalToken,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    );

    if (resetPassword.fulfilled.match(action)) {
      dispatch(clearAuthMessages());
      Alert.alert('Success', 'Password updated successfully.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
      return;
    }

    Alert.alert('Failed', action.error?.message || 'Unable to update password.');
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
            <Text style={styles.pageTitle}>Create Password</Text>

            <CustomInput
              label="Reset Token"
              placeholder="Paste reset token"
              value={token}
              onChangeText={setToken}
            />
            
            <CustomInput
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={true}
            />

            <CustomInput
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
            />

            <CustomButton 
              title={actionLoading.resetPassword ? 'Please wait...' : 'Update Password'}
              onPress={handleResetPassword}
              disabled={actionLoading.resetPassword}
            />
            {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}
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
    marginBottom: 15,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginTop: 10,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
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
    marginTop: -2,
  },
});
