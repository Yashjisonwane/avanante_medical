import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword } from '../../../redux/slices/authSlice';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.auth);

  const handleUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    try {
      const payload = {
        old_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      };
      
      const resultAction = await dispatch(changePassword(payload));
      if (changePassword.fulfilled.match(resultAction)) {
        Alert.alert(t('common.success'), t('profile.password_updated') || "Password updated successfully");
        router.back();
      } else {
        const errorMsg = resultAction.payload?.message || resultAction.error?.message || "Failed to update password";
        Alert.alert(t('common.error'), errorMsg);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(22)} color={AppColors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.change_password')}</Text>
        <View style={{ width: wp(40) }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('profile.current_password')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.flexInput} 
              placeholder={t('profile.current_password')} 
              placeholderTextColor={AppColors.placeholder} 
              value={currentPassword} 
              onChangeText={setCurrentPassword} 
              secureTextEntry={!showCurrent} 
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
              <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={ms(20)} color={AppColors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('profile.new_password')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.flexInput} 
              placeholder={t('profile.new_password')} 
              placeholderTextColor={AppColors.placeholder} 
              value={newPassword} 
              onChangeText={setNewPassword} 
              secureTextEntry={!showNew} 
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
              <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={ms(20)} color={AppColors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('common.confirm_password')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.flexInput} 
              placeholder={t('common.confirm_password')} 
              placeholderTextColor={AppColors.placeholder} 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry={!showConfirm} 
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={ms(20)} color={AppColors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={actionLoading.changePassword}>
          <Text style={styles.updateBtnText}>{actionLoading.changePassword ? 'Updating...' : t('common.update')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Avante Medical LMS v2.4.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundLight },
  header: { backgroundColor: AppColors.primary, paddingBottom: hp(14), flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(15) },
  backBtn: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: AppColors.textWhite, fontSize: fs(18), fontWeight: '700' },
  content: { padding: wp(20), paddingBottom: hp(40) },
  fieldContainer: { marginBottom: hp(20) },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: AppColors.textSecondary, marginBottom: hp(8) },
  inputWrapper: { 
    height: hp(52), 
    backgroundColor: AppColors.backgroundWhite, 
    borderRadius: ms(12), 
    borderWidth: 1.5, 
    borderColor: AppColors.border, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: wp(16) 
  },
  flexInput: { 
    flex: 1, 
    height: '100%', 
    fontSize: fs(14), 
    color: AppColors.textDark, 
    fontWeight: '500' 
  },
  eyeIcon: {
    padding: ms(5),
  },
  updateBtn: { height: hp(55), backgroundColor: AppColors.teal, borderRadius: ms(12), alignItems: 'center', justifyContent: 'center', marginTop: hp(15), elevation: 4, shadowColor: AppColors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  updateBtnText: { color: AppColors.textWhite, fontSize: fs(17), fontWeight: '700' },
  footerSection: { alignItems: 'center', paddingBottom: hp(15), backgroundColor: AppColors.backgroundLight },
  footerText: { fontSize: fs(12), color: AppColors.placeholder, fontWeight: '500' },
});
