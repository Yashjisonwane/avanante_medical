import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors, Spacing } from '../../../constants/Theme';
import { fetchLevelProgress, getHierarchyThunk, fetchDashboard } from '../../../redux/slices/courseSlice';
import { fetchProfile } from '../../../redux/slices/authSlice';
import { formatImageUrl } from '../../../utils/imageUtils';

// Generic robust percentage solver
const getCompletionPercent = (item, defaultVal = 0) => {
  if (!item) return defaultVal;
  const isCompleted = item.is_completed == true || item.is_completed == 1 || item.is_completed == 'true' || item.status === 'completed';
  
  let rawVal = item.completion_percentage ?? 
               item.completion_percent ?? 
               item.completion ??
               item.progress_percentage ?? 
               item.progress_percent ?? 
               item.progress ?? 
               null;
               
  if (rawVal === 'NaN' || rawVal === 'null' || rawVal === 'undefined' || rawVal === '') {
    rawVal = null;
  }
  
  const num = Number(rawVal);
  if (isNaN(num) || rawVal === null) {
    return isCompleted ? 100 : defaultVal;
  }
  return Math.min(100, Math.max(0, num));
};

const LevelCard = ({ 
  image, title, stats, progress, status, buttonText, 
  buttonVariant = 'primary', locked = false, badgeText,
  onPress, onFaqPress, rawLevel
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const description = rawLevel?.description || "";

  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <TouchableOpacity 
        style={[styles.imageContainer, !image && { backgroundColor: '#E2E8F0' }]} 
        onPress={onPress}
        disabled={locked}
        activeOpacity={0.9}
      >
        {image ? (
          <Image 
            source={formatImageUrl(image)} 
            style={[styles.levelImage, locked && styles.levelImageLocked]} 
            resizeMode="contain" 
          />
        ) : (
          <LinearGradient 
            colors={['#1E3A8A', '#3B82F6']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.blankImage}
          >
             <Ionicons name="school-outline" size={ms(40)} color="rgba(255,255,255,0.2)" />
          </LinearGradient>
        )}
        {badgeText && (
          <View style={[styles.badge, 
            status === 'Completed' && { backgroundColor: AppColors.badgeTealBg },
            status === 'Running' && { backgroundColor: AppColors.badgePrimaryBg },
            status === 'Locked' && { backgroundColor: AppColors.backgroundLight },
          ]}>
             <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Text style={[styles.levelTitle, locked && { color: AppColors.textSecondary }]} numberOfLines={2}>{title}</Text>
        
        {description ? (
          <View style={styles.descriptionContainer}>
            <Text 
              style={[styles.levelDescription, locked && { color: AppColors.textSecondary }]} 
              numberOfLines={isExpanded ? undefined : 2}
            >
              {description.replace(/<[^>]*>/g, '')}
            </Text>
            {description.length > 80 && (
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={styles.seeMoreText}>
                  {isExpanded ? t('common.see_less', 'See Less') : t('common.see_more', 'See More')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        <View style={styles.statsContainer}>
          <Ionicons name="book-outline" size={ms(14)} color={AppColors.textSecondary} />
          <Text style={styles.levelStats}>{stats}</Text>
        </View>

        {!locked && (
          <View style={styles.progressContainer}>
             <View style={styles.progressHeader}>
                <View style={styles.progressLabelRow}>
                   <Text style={styles.progressLabel}>{t('levels.level_progress')}</Text>
                </View>
                <Text style={styles.progressPercentage}>{progress}%</Text>
             </View>
             <View style={styles.progressBarTrack}>
                <View style={[styles.progressBar, { 
                  width: `${progress}%`, 
                  backgroundColor: status === 'Completed' ? AppColors.primaryDark : (status === 'Running' ? AppColors.teal : AppColors.disabled) 
                }]} />
             </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.faqButton, locked && styles.faqButtonLocked]} 
          onPress={onFaqPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="help-circle" 
            size={ms(20)} 
            color={locked ? AppColors.textSecondary : AppColors.warning} 
          />
          <Text style={[styles.faqButtonText, locked && { color: AppColors.textSecondary }]}>
            {t('levels.faqs')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, 
            buttonVariant === 'primary' && { backgroundColor: AppColors.primaryDark },
            buttonVariant === 'secondary' && { backgroundColor: AppColors.primaryDark },
            buttonVariant === 'locked' && { backgroundColor: AppColors.backgroundLight },
            locked && { backgroundColor: AppColors.backgroundLight, borderWidth: 0 }
          ]}
          onPress={onPress}
          disabled={locked}
          activeOpacity={0.8}
        >
          {locked && <Ionicons name="lock-closed" size={ms(18)} color={AppColors.textSecondary} style={{ marginRight: wp(8) }} />}
          <Text style={[styles.buttonText, locked && { color: AppColors.textSecondary }]}>
            {locked ? t('levels.locked') : buttonText}
          </Text>
          {!locked && <Ionicons name="arrow-forward" size={ms(18)} color={AppColors.textWhite} style={{ marginLeft: wp(8) }} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function LevelsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { levels, loading, error, dashboard } = useSelector((state) => state.course);
  const { user, language: currentLang, isAuthenticated, isHydrated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('All');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('common.good_morning', 'Good morning');
    if (hour < 17) return t('common.good_afternoon', 'Good afternoon');
    return t('common.good_evening', 'Good evening');
  };

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      dispatch(getHierarchyThunk());
      dispatch(fetchProfile());
      dispatch(fetchDashboard());
    }
  }, [dispatch, isHydrated, isAuthenticated, currentLang]);

  useEffect(() => {
    let backHandlerSubscription = null;

    const onBackPress = () => {
      return true;
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      if (isAuthenticated) {
        dispatch(getHierarchyThunk());
        dispatch(fetchDashboard());
      }
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

  const handleLevelPress = (levelId) => {
    router.push({
      pathname: '/(tabs)/levels/details',
      params: { id: levelId }
    });
  };

  const handleFaqPress = (levelId) => {
    router.push({
      pathname: '/(tabs)/levels/faq',
      params: { id: levelId, type: 'level' }
    });
  };

  if (loading.levels) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(10) }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
              <Ionicons name="arrow-back" size={ms(24)} color={AppColors.textWhite} />
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
               <Text style={styles.greetingText}>
                 {getGreeting()}, {user?.first_name ? `${user.first_name}` : (user?.name || 'User')}
               </Text>
               <Text style={styles.headerSubtitle}>{t('levels.all_levels')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={ms(24)} color={AppColors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={{ padding: 20, backgroundColor: '#FEE2E2', margin: 20, borderRadius: 10 }}>
          <Text style={{ color: '#991B1B', fontWeight: 'bold' }}>Error: {error}</Text>
          <TouchableOpacity 
            onPress={() => dispatch(getHierarchyThunk())}
            style={{ marginTop: 10, backgroundColor: '#991B1B', padding: 10, borderRadius: 5, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'All' && styles.tabActive]} onPress={() => setActiveTab('All')}>
          <Text style={[styles.tabLabel, activeTab === 'All' && styles.tabLabelActive]}>{t('levels.all_levels')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Completed' && styles.tabActive]} onPress={() => setActiveTab('Completed')}>
          <Text style={[styles.tabLabel, activeTab === 'Completed' && styles.tabLabelActive]}>{t('levels.completed')}</Text>
        </TouchableOpacity>
      </View>

      {loading.levels ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={AppColors.primaryDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(100) }]} showsVerticalScrollIndicator={false}>
          {/* Dynamic Levels from API */}
           {levels.map((level) => {
             const isUnlocked = level.is_unlocked == true || level.is_unlocked == 1 || level.is_unlocked == 'true' || level.is_unlocked == '1' || level.isUnlocked == true || level.isUnlocked == 1;
             const isCompleted = level.is_completed == true || level.is_completed == 1 || level.is_completed == 'true';
             
             // Calculate progress and modules count
             const modulesCount = level.modules ? level.modules.length : (level.modules_count || 0);
             
             // Extract matching level from dashboard levels array (which contains accurate progress)
             const dashboardLevels = dashboard?.levels || [];
             const matchingDashboardLevel = dashboardLevels.find(dl => dl.id === level.id);
             
             const progressPercentage = matchingDashboardLevel 
               ? getCompletionPercent(matchingDashboardLevel) 
               : getCompletionPercent(level);

             const currentStatus = isCompleted ? 'Completed' : (isUnlocked ? 'Running' : 'Locked');
             
              return (
                <LevelCard 
                  key={level.id}
                  image={level.thumbnail} 
                  title={level.title || t('levels.title_f1')} 
                  stats={t('levels.stats_format', { hours: level.duration || 4.5, modules: modulesCount })} 
                  progress={progressPercentage} 
                  status={level.status || currentStatus} 
                  badgeText={String(level.status || currentStatus || '').toUpperCase()} 
                  buttonText={isCompleted ? t('levels.take_exam') : (isUnlocked ? t('levels.continue') : t('levels.start_level'))} 
                  buttonVariant={isCompleted ? 'primary' : (isUnlocked ? 'secondary' : 'locked')} 
                  locked={!isUnlocked}
                  rawLevel={level}
                  onPress={() => isUnlocked && handleLevelPress(level.id)}
                  onFaqPress={() => handleFaqPress(level.id)}
                />
              );
           })}

          {/* Fallback/Dummy levels if API returns empty */}
          {levels.length === 0 && (
            <>
              <LevelCard image={null} title={t('levels.title_f1')} stats={t('levels.stats_format', { hours: 4.5, modules: 2 })} progress={0} status="Running" badgeText={t('levels.running').toUpperCase()} buttonText={t('levels.continue')} buttonVariant="secondary" onPress={() => handleLevelPress(1)} onFaqPress={() => handleFaqPress(1)} />
              <LevelCard image={null} title={t('levels.title_f2')} stats={t('levels.stats_format', { hours: 4.5, modules: 1 })} progress={0} status="Locked" badgeText={t('levels.locked').toUpperCase()} buttonText={t('levels.locked')} buttonVariant="locked" locked={true} onFaqPress={() => handleFaqPress(2)} />
              <LevelCard image={null} title={t('levels.title_i1')} stats={t('levels.stats_format', { hours: 6.2, modules: 0 })} progress={0} status="Locked" badgeText={t('levels.locked').toUpperCase()} buttonText={t('levels.locked')} buttonVariant="locked" locked={true} onFaqPress={() => handleFaqPress(3)} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundLight },
  header: { backgroundColor: AppColors.primaryDark, paddingBottom: hp(20) },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.SCREEN_PADDING, justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  greetingContainer: { marginLeft: wp(12) },
  greetingText: { fontSize: fs(18), fontWeight: '700', color: AppColors.textWhite },
  headerSubtitle: { fontSize: fs(12), color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerIcon: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fs(20), fontWeight: '700', color: AppColors.textWhite },
  tabContainer: { flexDirection: 'row', backgroundColor: AppColors.backgroundWhite, paddingHorizontal: Spacing.SCREEN_PADDING, paddingVertical: hp(15), gap: wp(15) },
  tab: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: ms(20), backgroundColor: AppColors.backgroundLight },
  tabActive: { backgroundColor: AppColors.primaryDark },
  tabLabel: { fontSize: fs(14), fontWeight: '600', color: AppColors.textSecondary },
  tabLabelActive: { color: AppColors.textWhite },
  scrollContent: { padding: Spacing.SCREEN_PADDING },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: AppColors.backgroundWhite, borderRadius: ms(20), marginBottom: hp(20), overflow: 'hidden', elevation: 4, shadowColor: AppColors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  cardLocked: { opacity: 0.8 },
  imageContainer: { height: hp(160), width: '100%', backgroundColor: AppColors.backgroundLight },
  levelImage: { width: '100%', height: '100%' },
  levelImageLocked: { opacity: 0.6, tintColor: 'gray' },
  blankImage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  badge: { position: 'absolute', top: hp(15), right: wp(15), paddingHorizontal: wp(15), paddingVertical: hp(6), borderRadius: ms(8) },
  badgeText: { fontSize: fs(12), fontWeight: '800', color: AppColors.textDark },
  cardContent: { padding: wp(20) },
  levelTitle: { fontSize: fs(20), fontWeight: '800', color: AppColors.textDark, marginBottom: hp(8), lineHeight: fs(28) },
  descriptionContainer: { marginBottom: hp(12) },
  levelDescription: { fontSize: fs(13), color: AppColors.textSecondary, lineHeight: fs(18), marginBottom: hp(4) },
  seeMoreText: { fontSize: fs(12), fontWeight: '700', color: AppColors.primary, marginBottom: hp(4) },
  statsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(15) },
  levelStats: { fontSize: fs(14), color: AppColors.textSecondary, marginLeft: wp(6) },
  progressContainer: { marginBottom: hp(20) },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(8) },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center' },
  progressLabel: { fontSize: fs(12), fontWeight: '700', color: AppColors.textSecondary },
  progressBarTrack: { height: hp(8), backgroundColor: AppColors.backgroundLight, borderRadius: ms(4) },
  progressBar: { height: '100%', borderRadius: ms(4) },
  progressPercentage: { fontSize: fs(12), fontWeight: '800', color: AppColors.textDark },
  faqButton: { 
    height: hp(48), 
    borderRadius: ms(12), 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: hp(12), 
    backgroundColor: '#FFF7ED', 
    borderWidth: 1, 
    borderColor: '#FED7AA' 
  },
  faqButtonLocked: { backgroundColor: AppColors.backgroundLight, borderColor: AppColors.border },
  faqButtonText: { fontSize: fs(15), fontWeight: '700', marginLeft: wp(8), color: AppColors.warning },
  actionButton: { height: hp(52), borderRadius: ms(12), alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonText: { fontSize: fs(16), fontWeight: '700', color: AppColors.textWhite },
});
