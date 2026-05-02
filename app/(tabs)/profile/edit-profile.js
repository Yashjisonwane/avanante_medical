import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../../redux/slices/authSlice';

const FormField = ({ label, placeholder, value, onChangeText, secureTextEntry = false }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput style={styles.fieldInput} placeholder={placeholder} placeholderTextColor={AppColors.placeholder} value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} />
  </View>
);

const SelectField = ({ label, placeholder, value }) => {
  const displayValue = typeof value === 'object' && value !== null ? (value.name || value.label || '') : value;
  
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectInput}>
        <Text style={displayValue ? styles.selectValue : styles.selectPlaceholder}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={ms(20)} color={AppColors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, actionLoading } = useSelector((state) => state.auth);

  const [employeeId, setEmployeeId] = useState(user?.employee_id || '');
  const [fullName, setFullName] = useState(user?.name || user?.first_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || '');
  const [region, setRegion] = useState(user?.region || '');

  const handleSave = async () => {
    try {
      const payload = {
        name: fullName,
        email: email,
        // add more fields if necessary
      };
      const resultAction = await dispatch(updateProfile(payload));
      if (updateProfile.fulfilled.match(resultAction)) {
        router.back();
      } else {
        alert(resultAction.error?.message || 'Update failed');
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
        <Text style={styles.headerTitle}>{t('profile.edit_profile')}</Text>
        <View style={{ width: wp(40) }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FormField label={t('common.employee_id')} placeholder="e.g. EMP-12345" value={employeeId} onChangeText={setEmployeeId} />
        <FormField label={t('common.full_name')} placeholder="e.g. Dr. Sarah Jenkins" value={fullName} onChangeText={setFullName} />
        <FormField label={t('common.email')} placeholder="sarah.jenkins@avantemedical.com" value={email} onChangeText={setEmail} />
        <SelectField label={t('common.role')} placeholder="Select Role" value={role} />
        <SelectField label={t('common.region')} placeholder="Select Region" value={region} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={actionLoading.updateProfile}>
          <Text style={styles.saveBtnText}>{actionLoading.updateProfile ? 'Saving...' : t('common.save')}</Text>
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
  fieldContainer: { marginBottom: hp(18) },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: AppColors.textSecondary, marginBottom: hp(8) },
  fieldInput: { height: hp(52), backgroundColor: AppColors.backgroundWhite, borderRadius: ms(12), borderWidth: 1.5, borderColor: AppColors.border, paddingHorizontal: wp(16), fontSize: fs(14), color: AppColors.textDark, fontWeight: '500' },
  selectInput: { height: hp(52), backgroundColor: AppColors.backgroundWhite, borderRadius: ms(12), borderWidth: 1.5, borderColor: AppColors.border, paddingHorizontal: wp(16), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectPlaceholder: { fontSize: fs(14), color: AppColors.placeholder, fontWeight: '500' },
  selectValue: { fontSize: fs(14), color: AppColors.textDark, fontWeight: '500' },
  saveBtn: { height: hp(55), backgroundColor: AppColors.teal, borderRadius: ms(12), alignItems: 'center', justifyContent: 'center', marginTop: hp(10), elevation: 4, shadowColor: AppColors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtnText: { color: AppColors.textWhite, fontSize: fs(17), fontWeight: '700' },
  footerSection: { alignItems: 'center', paddingBottom: hp(15), backgroundColor: AppColors.backgroundLight },
  footerText: { fontSize: fs(12), color: AppColors.placeholder, fontWeight: '500' },
});
