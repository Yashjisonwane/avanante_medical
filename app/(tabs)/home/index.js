import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import i18n from '../../../i18n';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors, Spacing } from '../../../constants/Theme';
import { getHierarchyThunk } from '../../../redux/slices/courseSlice';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'EN' },
  { code: 'hi', label: 'हिंदी', nativeLabel: 'HI' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', nativeLabel: 'PA' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { user } = useSelector((state) => state.auth);
  const { levels, currentLevel, loading } = useSelector((state) => state.course);

  const dashboardLevel = levels[0] || currentLevel || {};

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    dispatch(getHierarchyThunk());
  }, [dispatch]);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    setShowLanguageModal(false);
    
    // Re-fetch hierarchy in the new language
    dispatch(getHierarchyThunk());
    
    const langName = LANGUAGES.find(l => l.code === langCode)?.label || langCode;
    showToastMessage(`Language changed to ${langName}`);
  };

  const getCurrentLangLabel = () => {
    return LANGUAGES.find(l => l.code === currentLang)?.nativeLabel || 'EN';
  };

  return (
    <View style={styles.container}>
      {/* Toast */}
      {showToast && (
        <Animated.View style={[styles.toastContainer, { top: insets.top + hp(10), transform: [{ translateY: toastAnim }] }]}>
          <View style={styles.toastContent}>
            <Ionicons name="checkmark-circle" size={ms(20)} color={AppColors.teal} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.select_language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langItem, currentLang === item.code && styles.langItemActive]}
                  onPress={() => changeLanguage(item.code)}
                >
                  <Text style={[styles.langItemText, currentLang === item.code && styles.langItemTextActive]}>
                    {item.label}
                  </Text>
                  {currentLang === item.code && <Ionicons name="checkmark-circle" size={ms(22)} color={AppColors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(8) }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('home.title')}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.languageSelector} onPress={() => setShowLanguageModal(true)}>
              <Ionicons name="globe-outline" size={ms(16)} color={AppColors.textDark} />
              <Text style={styles.languageText}>{getCurrentLangLabel()}</Text>
              <Ionicons name="chevron-down" size={ms(14)} color={AppColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={ms(24)} color="#fff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.SCREEN_PADDING, paddingBottom: hp(100) }}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{t('home.welcome_back', { name: user?.first_name || 'Dr. Sarah' })}</Text>
          <Text style={styles.welcomeSub}>{t('home.courses_to_finish', { count: dashboardLevel?.modules_count || 3 })}</Text>
          <View style={styles.signupBanner}>
            <Text style={styles.signupText}>{t('home.success_banner')}</Text>
          </View>
        </View>

        {/* Curriculum Card */}
        <View style={styles.curriculumCard}>
          {loading.levelDetail ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginVertical: hp(40) }} />
          ) : (
            <>
              <View style={styles.curriculumHeader}>
                <View style={{flexShrink: 1}}>
                  <Text style={styles.curriculumLevel}>{t('home.curriculum_level')}</Text>
                  <Text style={styles.curriculumTitle}>{dashboardLevel?.title || t('home.curriculum_title')}</Text>
                </View>
                <TouchableOpacity style={styles.listIconContainer} onPress={() => router.push('/(tabs)/levels')}>
                  <Ionicons name="list" size={ms(22)} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.progressSection}>
                 <View style={styles.progressLabels}>
                    <Text style={styles.lastTopic}>{dashboardLevel?.last_topic?.title || t('home.last_topic')}</Text>
                    <Text style={styles.percentageText}>{dashboardLevel?.progress_percentage || 0}%</Text>
                 </View>
                 <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBar, { width: `${dashboardLevel?.progress_percentage || 0}%` }]} />
                 </View>
              </View>
              <TouchableOpacity 
                style={styles.resumeButton} 
                onPress={() => router.push({
                  pathname: '/(tabs)/levels/details',
                  params: { id: dashboardLevel?.id || 1 }
                })}
              >
                <Text style={styles.resumeButtonText}>{t('home.resume_lesson')}</Text>
                <Ionicons name="play-circle-outline" size={ms(22)} color={AppColors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Learning Path */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.learning_path')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/levels')}>
            <Text style={styles.sectionLink}>{t('home.view_all_levels')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.learningPathRow}>
          <View style={[styles.pathCard, (dashboardLevel?.progress_percentage === 100) && styles.pathCardCompleted]}>
            <View style={styles.pathIconCircle}>
              {(dashboardLevel?.progress_percentage === 100) ? (
                <Ionicons name="checkmark-circle" size={ms(32)} color={AppColors.success} />
              ) : (
                <Ionicons name="play-circle" size={ms(32)} color={AppColors.primary} />
              )}
            </View>
            <Text style={styles.pathLevel}>{t('home.level_1')}</Text>
            <Text style={(dashboardLevel?.progress_percentage === 100) ? styles.pathStatusCompleted : { color: AppColors.primary, fontSize: fs(10), fontWeight: '800' }}>
              {(dashboardLevel?.progress_percentage === 100) ? t('home.completed') : t('home.started')}
            </Text>
          </View>
          <View style={styles.pathCard}>
            <View style={styles.pathIconCircle}>
              <Ionicons name="lock-closed" size={ms(32)} color={AppColors.placeholder} />
            </View>
            <Text style={styles.pathLevel}>{t('home.level_2')}</Text>
            <Text style={styles.pathStatusLocked}>{t('home.locked')}</Text>
          </View>
        </View>

        {/* Assigned Courses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.assigned_courses')}</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>{t('home.view_all')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseItem}>
          <View style={styles.courseIconContainer}>
            <Ionicons name="shield-checkmark-outline" size={ms(24)} color={AppColors.primary} />
          </View>
          <View style={styles.courseDetails}>
            <Text style={styles.courseName}>{t('home.course_pacemaker')}</Text>
            <Text style={styles.courseDue}>{t('home.due_days', { days: 4 })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#FFF5E6' }]}>
            <Text style={[styles.statusText, { color: '#F59E0B' }]}>{t('home.pending')}</Text>
          </View>
        </View>

        <View style={styles.courseItem}>
          <View style={styles.courseIconContainer}>
            <Ionicons name="medical-outline" size={ms(24)} color={AppColors.primary} />
          </View>
          <View style={styles.courseDetails}>
            <Text style={styles.courseName}>{t('home.course_terminology')}</Text>
            <Text style={styles.courseDue}>{t('home.due_days', { days: 12 })}</Text>
            <View style={styles.miniProgressTrack}>
              <View style={[styles.miniProgressBar, { width: '40%', backgroundColor: AppColors.success }]} />
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.statusText, { color: AppColors.success }]}>{t('home.started')}</Text>
          </View>
        </View>

        {/* Analytics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.analytics')}</Text>
        </View>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsCard}>
            <View style={styles.circleChart}>
              <Text style={styles.circlePercentage}>75%</Text>
            </View>
            <Text style={styles.analyticsLabel}>{t('home.avg_score')}</Text>
          </View>
          <View style={styles.analyticsCard}>
            <View style={styles.barChartPlaceholder}>
               <View style={[styles.bar, { height: '40%' }]} />
               <View style={[styles.bar, { height: '70%', backgroundColor: AppColors.primary }]} />
               <View style={[styles.bar, { height: '50%' }]} />
               <View style={[styles.bar, { height: '90%', backgroundColor: AppColors.primary }]} />
               <View style={[styles.bar, { height: '60%' }]} />
            </View>
            <Text style={styles.analyticsLabel}>{t('home.time_spent')}</Text>
          </View>
        </View>

        {/* Updates */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.latest_updates')}</Text>
        </View>
        <View style={styles.updateItem}>
          <View style={[styles.updateIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="add" size={ms(20)} color={AppColors.primary} />
          </View>
          <View style={styles.updateInfo}>
            <Text style={styles.updateTitle} numberOfLines={2}>{t('home.new_course_crispr')}</Text>
            <Text style={styles.updateTime}>{t('home.two_hours_ago')}</Text>
          </View>
        </View>
        <View style={styles.updateItem}>
          <View style={[styles.updateIconContainer, { backgroundColor: '#DCFCE7' }]}>
             <Ionicons name="ribbon-outline" size={ms(20)} color={AppColors.success} />
          </View>
          <View style={styles.updateInfo}>
            <Text style={styles.updateTitle}>{t('home.cert_earned')}</Text>
            <Text style={styles.updateTime}>{t('home.yesterday')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundLight },
  header: { backgroundColor: AppColors.primaryDark, paddingBottom: hp(15) },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.SCREEN_PADDING, justifyContent: 'space-between' },
  headerBackBtn: { width: ms(40), height: ms(40), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fs(20), fontWeight: '800', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  languageSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: wp(12), paddingVertical: hp(6), borderRadius: ms(20), marginRight: wp(12) },
  languageText: { fontSize: fs(12), fontWeight: '800', marginHorizontal: wp(4), color: AppColors.textDark },
  notificationIcon: { width: ms(40), height: ms(40), borderRadius: ms(20), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: hp(8), right: wp(8), width: ms(8), height: ms(8), borderRadius: ms(4), backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#fff' },
  content: { flex: 1 },
  welcomeSection: { marginTop: hp(15), marginBottom: hp(20) },
  welcomeTitle: { fontSize: fs(26), fontWeight: '800', color: AppColors.textDark },
  welcomeSub: { fontSize: fs(16), color: AppColors.textSecondary, marginTop: hp(4) },
  signupBanner: { backgroundColor: '#E6F6F4', padding: wp(14), borderRadius: ms(12), borderStyle: 'dotted', borderWidth: 1, borderColor: AppColors.teal, marginTop: hp(15) },
  signupText: { color: AppColors.teal, fontSize: fs(14), fontWeight: '700', textAlign: 'center' },
  curriculumCard: { backgroundColor: AppColors.primary, borderRadius: ms(20), padding: wp(20), marginBottom: hp(25), elevation: 8, shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  curriculumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  curriculumLevel: { color: '#FCD34D', fontSize: fs(11), fontWeight: '900', letterSpacing: 1, marginBottom: hp(4) },
  curriculumTitle: { color: '#fff', fontSize: fs(20), fontWeight: '800', flexShrink: 1, lineHeight: fs(26) },
  listIconContainer: { backgroundColor: 'rgba(255,255,255,0.25)', padding: ms(10), borderRadius: ms(12) },
  progressSection: { marginTop: hp(20), marginBottom: hp(20) },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(8) },
  lastTopic: { color: '#fff', fontSize: fs(12), opacity: 0.9, fontWeight: '500' },
  percentageText: { color: '#fff', fontSize: fs(13), fontWeight: '800' },
  progressBarTrack: { height: hp(8), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: ms(4) },
  progressBar: { height: '100%', backgroundColor: '#fff', borderRadius: ms(4) },
  resumeButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp(14), borderRadius: ms(14), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  resumeButtonText: { color: AppColors.primary, fontSize: fs(16), fontWeight: '800', marginRight: wp(8) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(15) },
  sectionTitle: { fontSize: fs(18), fontWeight: '800', color: AppColors.textDark },
  sectionLink: { color: AppColors.primary, fontWeight: '800', fontSize: fs(13) },
  learningPathRow: { flexDirection: 'row', gap: wp(15), marginBottom: hp(25) },
  pathCard: { flex: 1, backgroundColor: '#fff', borderRadius: ms(20), padding: wp(18), alignItems: 'center', borderWidth: 1, borderColor: '#f1f1f1', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  pathCardCompleted: { borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' },
  pathIconCircle: { marginBottom: hp(10) },
  pathLevel: { fontSize: fs(16), fontWeight: '800', color: AppColors.textDark, marginBottom: hp(2) },
  pathStatusCompleted: { fontSize: fs(11), fontWeight: '900', color: AppColors.success },
  pathStatusLocked: { fontSize: fs(11), fontWeight: '900', color: AppColors.placeholder },
  courseItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: ms(18), padding: wp(15), marginBottom: hp(12), alignItems: 'center', gap: wp(12), borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  courseIconContainer: { width: ms(50), height: ms(50), borderRadius: ms(14), backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  courseDetails: { flex: 1 },
  courseName: { fontSize: fs(16), fontWeight: '800', color: AppColors.textDark, marginBottom: hp(2) },
  courseDue: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: hp(6) },
  miniProgressTrack: { height: hp(4), backgroundColor: '#f1f5f9', borderRadius: ms(2), width: '85%' },
  miniProgressBar: { height: '100%', borderRadius: ms(2) },
  statusBadge: { paddingHorizontal: wp(10), paddingVertical: hp(5), borderRadius: ms(8) },
  statusText: { fontSize: fs(10), fontWeight: '900', textTransform: 'uppercase' },
  analyticsRow: { flexDirection: 'row', gap: wp(15), marginBottom: hp(25) },
  analyticsCard: { flex: 1, backgroundColor: '#fff', borderRadius: ms(20), padding: wp(18), alignItems: 'center', borderWidth: 1, borderColor: '#f1f1f1' },
  circleChart: { width: ms(56), height: ms(56), borderRadius: ms(28), borderWidth: 6, borderColor: AppColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: hp(10) },
  circlePercentage: { fontSize: fs(14), fontWeight: '900', color: AppColors.primary },
  analyticsLabel: { fontSize: fs(10), fontWeight: '800', color: AppColors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  barChartPlaceholder: { flexDirection: 'row', alignItems: 'flex-end', height: hp(50), gap: wp(5), marginBottom: hp(10) },
  bar: { width: wp(8), backgroundColor: '#E5E7EB', borderRadius: ms(3) },
  updateItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: ms(18), padding: wp(15), marginBottom: hp(12), alignItems: 'center', gap: wp(12), borderWidth: 1, borderColor: '#f0f0f0' },
  updateIconContainer: { width: ms(44), height: ms(44), borderRadius: ms(22), alignItems: 'center', justifyContent: 'center' },
  updateInfo: { flex: 1 },
  updateTitle: { fontSize: fs(15), fontWeight: '700', color: AppColors.textDark, lineHeight: fs(20) },
  updateTime: { fontSize: fs(12), color: AppColors.textSecondary, marginTop: hp(4) },
  toastContainer: { position: 'absolute', left: wp(20), right: wp(20), zIndex: 9999 },
  toastContent: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: wp(18), borderRadius: ms(16), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, borderLeftWidth: 5, borderLeftColor: AppColors.teal, elevation: 10 },
  toastText: { flex: 1, fontSize: fs(15), fontWeight: '700', color: AppColors.textDark, marginLeft: wp(12) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: ms(24), padding: wp(20), width: '85%', maxHeight: hp(400), shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 15 },
  modalTitle: { fontSize: fs(20), fontWeight: '900', color: AppColors.textDark, marginBottom: hp(20), textAlign: 'center' },
  langItem: { paddingVertical: hp(15), paddingHorizontal: wp(18), borderRadius: ms(16), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(8), backgroundColor: '#F8FAFC' },
  langItemActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  langItemText: { fontSize: fs(17), fontWeight: '700', color: AppColors.textDark },
  langItemTextActive: { color: AppColors.primary, fontWeight: '800' },
});
