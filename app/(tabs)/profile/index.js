import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  BackHandler,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { logoutUser, fetchProfile, updateProfile, setLanguage } from '../../../redux/slices/authSlice';
import { formatImageUrl } from '../../../utils/imageUtils';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

const MenuItem = ({ icon, label, onPress, isLogout = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconCircle, isLogout && styles.menuIconLogout]}>
      <Ionicons name={icon} size={ms(20)} color={isLogout ? AppColors.danger : AppColors.primary} />
    </View>
    <Text style={[styles.menuLabel, isLogout && styles.menuLabelLogout]}>{label}</Text>
    {!isLogout && (
      <Ionicons name="chevron-forward" size={ms(20)} color={AppColors.placeholder} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user, language } = useSelector((state) => state.auth);
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);

  const currentLanguage = LANGUAGE_OPTIONS.find((option) => option.code === language) || LANGUAGE_OPTIONS[0];

  React.useEffect(() => {
    dispatch(fetchProfile());
    
    let backHandlerSubscription = null;

    const onBackPress = () => {
      // Prevent navigating back to Home tab
      return true;
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      dispatch(fetchProfile());
      backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
        backHandlerSubscription = null;
      }
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
      }
    };
  }, [navigation]);

  // Reset image error when user data changes
  React.useEffect(() => {
    setProfileImageError(false);
  }, [user?.profile_image, user?.avatar]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.replace('/(auth)/login');
  };

  const [uploading, setUploading] = React.useState(false);
  const [profileImageError, setProfileImageError] = React.useState(false);

  const handleImagePick = async () => {
    Alert.alert(
      t('profile.upload_photo', 'Upload Photo'),
      t('profile.choose_method', 'Choose a method to upload your photo'),
      [
        {
          text: t('profile.camera', 'Take Photo'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('common.permission_needed'), t('common.permission_camera_required'));
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              uploadPhoto(result.assets[0]);
            }
          }
        },
        {
          text: t('profile.gallery', 'Choose from Gallery'),
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('common.permission_needed'), t('common.permission_gallery_required'));
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              uploadPhoto(result.assets[0]);
            }
          }
        },
        { text: t('common.cancel', 'Cancel'), style: 'cancel' }
      ]
    );
  };

  const uploadPhoto = async (asset) => {
    try {
      setUploading(true);
      
      const fileUri = asset.uri;
      const fileName = asset.fileName || fileUri.split('/').pop() || 'profile.jpg';
      const fileType = asset.mimeType || (fileUri.endsWith('.png') ? 'image/png' : 'image/jpeg');

      const fileObj = {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name: fileName,
        type: fileType,
      };
      
      const payload = { avatar: fileObj, profile_image: fileObj };
      const resultAction = await dispatch(updateProfile(payload));
      if (updateProfile.fulfilled.match(resultAction)) {
        await dispatch(fetchProfile());
        Alert.alert(t('common.success'), t('profile.photo_updated'));
      }
    } catch (error) {
      console.log('Upload error', error);
      Alert.alert(t('common.error'), t('profile.photo_update_failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(2) }]}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
              {!profileImageError ? (
                <Image 
                  key={(() => {
                    const imageUrl = user?.profile_image || user?.avatar || user?.profile_photo_url || user?.profile_photo || user?.photo || user?.avatar_url || user?.image_url || user?.image;
                    return imageUrl ? String(imageUrl) : 'placeholder';
                  })()}
                  source={(() => {
                    const imageUrl = user?.profile_image || user?.avatar || user?.profile_photo_url || user?.profile_photo || user?.photo || user?.avatar_url || user?.image_url || user?.image;
                    const src = formatImageUrl(imageUrl);
                    if (src && src.uri && !src.uri.startsWith('file') && !src.uri.startsWith('content')) {
                      // Add robust cache busting
                      const timestamp = (user?.updated_at && !isNaN(new Date(user.updated_at).getTime())) 
                        ? new Date(user.updated_at).getTime() 
                        : Date.now();
                      src.uri = `${src.uri}${src.uri.includes('?') ? '&' : '?'}cache=${timestamp}`;
                      return src;
                    }
                    // Fallback if no valid image URL
                    return null;
                  })()} 
                  style={[styles.avatar, uploading && { opacity: 0.5 }]} 
                  onError={(e) => {
                    console.log("Image load error for:", user?.profile_image || user?.avatar, e.nativeEvent.error);
                    setProfileImageError(true);
                  }}
                />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="person" size={ms(40)} color="#CBD5E1" />
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={ms(14)} color={AppColors.textWhite} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{user?.name || user?.first_name || 'Loading...'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>ID: AV-9942</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>NORTH AMERICA</Text></View>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.menuSection}>
          <MenuItem icon="create-outline" label={t('profile.edit_profile')} onPress={() => router.push('/(tabs)/profile/edit-profile')} />
          <MenuItem icon="language-outline" label={t('common.change_language', 'Change Language')} onPress={() => setLanguageModalVisible(true)} />
          <MenuItem icon="lock-closed-outline" label={t('profile.change_password')} onPress={() => router.push('/(tabs)/profile/change-password')} />
          <MenuItem icon="log-out-outline" label={t('profile.logout')} isLogout={true} onPress={handleLogout} />
        </View>

      </ScrollView>

      <Modal visible={languageModalVisible} transparent animationType="fade" onRequestClose={() => setLanguageModalVisible(false)}>
        <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={() => setLanguageModalVisible(false)}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>{t('common.select_language')}</Text>
            {LANGUAGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={[modalStyles.modalItem, currentLanguage.code === option.code && modalStyles.modalItemActive]}
                onPress={async () => {
                  await dispatch(setLanguage(option.code));
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[modalStyles.modalItemText, currentLanguage.code === option.code && modalStyles.modalItemTextActive]}>{option.nativeLabel}</Text>
                {currentLanguage.code === option.code && <Text style={modalStyles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
  content: { paddingBottom: hp(40) },
  avatarSection: { alignItems: 'center', paddingTop: hp(30), paddingBottom: hp(25), backgroundColor: AppColors.backgroundWhite },
  avatarWrapper: { width: wp(100), height: wp(100), marginBottom: hp(16), position: 'relative' },
  avatar: { width: wp(100), height: wp(100), borderRadius: wp(50), borderWidth: 3, borderColor: AppColors.badgePrimaryBg },
  cameraBtn: { position: 'absolute', bottom: hp(2), right: wp(2), width: wp(32), height: wp(32), borderRadius: wp(16), backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: AppColors.backgroundWhite, elevation: 4 },
  profileName: { fontSize: fs(22), fontWeight: '800', color: AppColors.textDark, marginBottom: hp(4) },
  profileEmail: { fontSize: fs(13), color: AppColors.textSecondary, fontWeight: '500', marginBottom: hp(16) },
  badgeRow: { flexDirection: 'row', gap: wp(10) },
  badge: { backgroundColor: AppColors.backgroundLight, paddingHorizontal: wp(14), paddingVertical: hp(6), borderRadius: ms(20), borderWidth: 1, borderColor: AppColors.border },
  badgeText: { fontSize: fs(11), fontWeight: '700', color: AppColors.textSecondary, letterSpacing: 0.5 },
  divider: { height: hp(8), backgroundColor: AppColors.backgroundLight },
  menuSection: { backgroundColor: AppColors.backgroundWhite, paddingHorizontal: wp(20), paddingTop: hp(10) },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(18), borderBottomWidth: 1, borderBottomColor: AppColors.backgroundLight },
  menuIconCircle: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: AppColors.badgePrimaryBg, alignItems: 'center', justifyContent: 'center', marginRight: wp(15) },
  menuIconLogout: { backgroundColor: AppColors.badgeDangerBg },
  menuLabel: { flex: 1, fontSize: fs(15), fontWeight: '600', color: AppColors.textDark },
  menuLabelLogout: { color: AppColors.danger, fontWeight: '700' },
  footerSection: { alignItems: 'center', paddingBottom: hp(15), backgroundColor: AppColors.backgroundLight },
  footerText: { fontSize: fs(12), color: AppColors.placeholder, fontWeight: '500' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
  },
  modalContent: {
    width: '100%',
    backgroundColor: AppColors.backgroundWhite,
    borderRadius: ms(20),
    padding: wp(20),
  },
  modalTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginBottom: hp(15),
    color: AppColors.textDark,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: wp(10),
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundLight,
  },
  modalItemActive: {
    backgroundColor: AppColors.backgroundLight,
  },
  modalItemText: {
    fontSize: fs(15),
    color: AppColors.textDark,
  },
  modalItemTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  modalCheck: {
    fontSize: fs(16),
    color: AppColors.primary,
    fontWeight: '700',
  },
});
