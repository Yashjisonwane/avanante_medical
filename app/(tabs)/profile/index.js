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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { logoutUser, fetchProfile, updateProfile } from '../../../redux/slices/authSlice';
import { formatImageUrl } from '../../../utils/imageUtils';

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
  const { user } = useSelector((state) => state.auth);

  React.useEffect(() => {
    dispatch(fetchProfile());
    
    let backHandlerSubscription = null;

    const onBackPress = () => {
      // Prevent navigating back to Home tab
      return true;
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
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

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.replace('/(auth)/login');
  };

  const [uploading, setUploading] = React.useState(false);

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
              Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
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
              Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
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
      const fileObj = {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: asset.mimeType || 'image/jpeg',
      };
      
      // Update the profile - sending both common keys just in case
      await dispatch(updateProfile({ avatar: fileObj, profile_image: fileObj })).unwrap();
      
      // Re-fetch profile to update UI immediately
      dispatch(fetchProfile());
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.log('Upload error', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
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
              <Image 
                source={formatImageUrl(user?.avatar) || { uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                style={[styles.avatar, uploading && { opacity: 0.5 }]} 
              />
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
          <MenuItem icon="lock-closed-outline" label={t('profile.change_password')} onPress={() => router.push('/(tabs)/profile/change-password')} />
          <MenuItem icon="log-out-outline" label={t('profile.logout')} isLogout={true} onPress={handleLogout} />
        </View>

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
