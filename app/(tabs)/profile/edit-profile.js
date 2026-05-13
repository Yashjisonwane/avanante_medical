import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, fetchRoles, fetchDesignations, clearAuthMessages, fetchProfile } from '../../../redux/slices/authSlice';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { formatImageUrl } from '../../../utils/imageUtils';
import CustomInput from '../../../components/CustomInput';
import CustomDropdown from '../../../components/CustomDropdown';

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

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, actionLoading, roles, designations, successMessage, errorMessage } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    employee_id: user?.employee_id || '',
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    designation_id: user?.designation_id || '',
    role_id: user?.role_id || '',
    region: user?.region || '',
    city: user?.city || '',
    profile_image_uri: user?.profile_image || user?.avatar || user?.profile_photo_url || user?.profile_photo || user?.photo || user?.avatar_url || user?.image_url || user?.image || '',
    profile_image_asset: null, // Store full asset for upload
  });
  const [profileImageError, setProfileImageError] = useState(false);

  // Autofill form when user data is available
  useEffect(() => {
    if (user) {
      setForm({
        employee_id: user.employee_id || '',
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        designation_id: user.designation_id || '',
        role_id: user.role_id || '',
        region: user.region || '',
        city: user.city || '',
        profile_image_uri: user.profile_image || user.avatar || user.profile_photo_url || user.profile_photo || user.photo || user.avatar_url || user.image_url || user.image || '',
        profile_image_asset: null,
      });
    }
  }, [user]);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchDesignations());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      Alert.alert(t('common.success'), successMessage);
      dispatch(clearAuthMessages());
    }
    if (errorMessage) {
      Alert.alert(t('common.error'), errorMessage);
      dispatch(clearAuthMessages());
    }
  }, [successMessage, errorMessage, dispatch]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permission_denied'), 'Please grant gallery permissions to upload a photo.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setForm(prev => ({
        ...prev,
        profile_image_uri: result.assets[0].uri,
        profile_image_asset: result.assets[0],
      }));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.mobile) {
      Alert.alert(t('common.missing_fields'), 'Name, Email and Mobile are required.');
      return;
    }

    // Fields the backend supports based on the response JSON provided
    const supportedPayload = {
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      region: form.region,
      city: form.city,
      designation_id: form.designation_id,
      employee_id: form.employee_id,
      role_id: form.role_id,
    };

    // Add image if present
    if (form.profile_image_asset) {
      const asset = form.profile_image_asset;
      const imgObj = {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        name: asset.fileName || 'profile.jpg',
        type: asset.mimeType || 'image/jpeg',
      };

      // Fix for Android file:// prefix if needed (though usually RN handles it)

      if (Platform.OS === 'android' && !imgObj.uri.startsWith('file://') && !imgObj.uri.startsWith('content://')) {
        imgObj.uri = `file://${imgObj.uri}`;
      }

      supportedPayload.profile_image = imgObj;
      supportedPayload.avatar = imgObj;
    }


    const resultAction = await dispatch(updateProfile(supportedPayload));
    if (updateProfile.fulfilled.match(resultAction)) {
      // Re-fetch profile to update global state and ensure sync
      await dispatch(fetchProfile());
      router.back();
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity onPress={pickImage}>
                {!profileImageError ? (
                  <Image 
                    key={(() => {
                      const imageUrl = form.profile_image_uri || user?.profile_image || user?.avatar || user?.profile_photo_url || user?.profile_photo || user?.photo || user?.avatar_url || user?.image_url || user?.image;
                      return imageUrl ? String(imageUrl) : 'placeholder';
                    })()}
                    source={(() => {
                      const imageUrl = form.profile_image_uri || user?.profile_image || user?.avatar || user?.profile_photo_url || user?.profile_photo || user?.photo || user?.avatar_url || user?.image_url || user?.image;
                      const src = formatImageUrl(imageUrl);
                      if (src && src.uri && !src.uri.startsWith('file') && !src.uri.startsWith('content')) {
                        // Add robust cache busting
                        const timestamp = (user?.updated_at && !isNaN(new Date(user.updated_at).getTime())) 
                          ? new Date(user.updated_at).getTime() 
                          : Date.now();
                        src.uri = `${src.uri}${src.uri.includes('?') ? '&' : '?'}cache=${timestamp}`;
                        return src;
                      }
                      return src;
                    })()} 
                    style={styles.avatar} 
                    onError={(e) => {
                      console.log("Edit Profile Image Load Error:", e.nativeEvent.error);
                      setProfileImageError(true);
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="person" size={ms(40)} color="#CBD5E1" />
                  </View>
                )}
                <View style={styles.cameraBtn}>
                  <Ionicons name="camera" size={ms(14)} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <CustomInput
            label={t('common.full_name')}
            placeholder="e.g. John Doe"
            value={form.name}
            onChangeText={(val) => updateForm('name', val)}
            leftIcon="person-outline"
            required
          />

          <CustomInput
            label={t('common.email')}
            placeholder="example@gmail.com"
            value={form.email}
            onChangeText={(val) => updateForm('email', val)}
            keyboardType="email-address"
            leftIcon="mail-outline"
            required
          />

          <CustomInput
            label={t('common.mobile')}
            placeholder="0000000000"
            value={form.mobile}
            onChangeText={(val) => updateForm('mobile', val)}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            required
          />

          <CustomInput
            label={t('common.employee_id')}
            placeholder="Emp 123"
            value={form.employee_id}
            onChangeText={(val) => updateForm('employee_id', val)}
            leftIcon="business-outline"
          />

          <CustomDropdown
            label={t('common.designation')}
            placeholder={designations.length === 0 ? "Loading..." : "Select Designation"}
            options={designations}
            value={form.designation_id}
            onSelect={(val) => updateForm('designation_id', val)}
          />

          <CustomDropdown
            label={t('common.region')}
            placeholder="Select Country"
            options={COUNTRIES}
            value={form.region}
            onSelect={(val) => updateForm('region', val)}
          />

          <CustomDropdown
            label={t('common.role')}
            placeholder="Select Role"
            options={roles}
            value={form.role_id}
            onSelect={(val) => updateForm('role_id', val)}
          />

          <CustomInput
            label={t('common.city')}
            placeholder="City name"
            value={form.city}
            onChangeText={(val) => updateForm('city', val)}
            leftIcon="location-outline"
          />

          <TouchableOpacity
            style={[styles.saveBtn, actionLoading.updateProfile && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={actionLoading.updateProfile}
          >
            <Text style={styles.saveBtnText}>
              {actionLoading.updateProfile ? 'Saving...' : t('common.save')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Avante Medical LMS v2.4.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundLight },
  header: {
    backgroundColor: AppColors.primary,
    paddingBottom: hp(14),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(15),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtn: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: AppColors.textWhite, fontSize: fs(18), fontWeight: '700' },
  content: { padding: wp(20), paddingBottom: hp(40) },
  avatarSection: {
    alignItems: 'center',
    marginBottom: hp(25),
  },
  avatarWrapper: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: 4,
    borderColor: '#F8FAFC',
    backgroundColor: '#F1F5F9',
    marginBottom: hp(15),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: ms(50),
    resizeMode: 'contain',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  saveBtn: {
    height: hp(55),
    backgroundColor: AppColors.teal,
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(20),
    elevation: 4,
    shadowColor: AppColors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  saveBtnText: { color: AppColors.textWhite, fontSize: fs(17), fontWeight: '700' },
  footerSection: { alignItems: 'center', paddingBottom: hp(15), backgroundColor: AppColors.backgroundLight },
  footerText: { fontSize: fs(12), color: AppColors.placeholder, fontWeight: '500' },
});
