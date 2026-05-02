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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors, Spacing } from '../../../constants/Theme';
import { fetchLevelProgress, getHierarchyThunk } from '../../../redux/slices/courseSlice';
import { formatImageUrl } from '../../../utils/imageUtils';

const LevelCard = ({ 
  image, title, stats, progress, status, buttonText, 
  buttonVariant = 'primary', locked = false, badgeText,
  onPress, rawLevel
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={formatImageUrl(image)} 
          style={styles.levelImage} 
          resizeMode="cover" 
        />
        {badgeText && (
          <View style={[styles.badge, 
            status === 'Completed' && { backgroundColor: AppColors.badgeTealBg },
            status === 'Running' && { backgroundColor: AppColors.badgePrimaryBg },
            status === 'Locked' && { backgroundColor: AppColors.backgroundLight },
          ]}>
             <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.levelTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.levelStats}>{stats}</Text>
        <View style={styles.progressContainer}>
           <Text style={styles.progressLabel}>{t('levels.level_progress')}</Text>
           <View style={styles.progressBarTrack}>
              <View style={[styles.progressBar, { 
                width: `${progress}%`, 
                backgroundColor: status === 'Completed' ? AppColors.primaryDark : (status === 'Running' ? AppColors.teal : AppColors.disabled) 
              }]} />
           </View>
           <Text style={styles.progressPercentage}>{progress}%</Text>
        </View>
        <View style={[styles.actionButton, 
          buttonVariant === 'primary' && { backgroundColor: AppColors.primaryDark },
          buttonVariant === 'secondary' && { backgroundColor: AppColors.teal },
          buttonVariant === 'locked' && { backgroundColor: AppColors.backgroundWhite, borderWidth: 1.5, borderColor: AppColors.primaryDark },
          locked && { borderColor: AppColors.primaryDark }
        ]}>
          <Text style={[styles.buttonText, locked && { color: AppColors.primaryDark }]}>{buttonText}</Text>
          {locked && <Ionicons name="lock-closed" size={ms(18)} color={AppColors.textSecondary} style={{ marginLeft: wp(8) }} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function LevelsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { levels, loading, error } = useSelector((state) => state.course);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    dispatch(getHierarchyThunk());
  }, [dispatch]);

  useEffect(() => {
    let backHandlerSubscription = null;

    const onBackPress = () => {
      return true;
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      dispatch(getHierarchyThunk());
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

  if (loading.levels) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={ms(24)} color={AppColors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('levels.all_levels')}</Text>
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
             let progressPercentage = level.progress_percentage || 0;
             if (!level.progress_percentage && level.modules && modulesCount > 0) {
               const completedModules = level.modules.filter(m => m.is_completed == true || m.is_completed == 1 || m.is_completed == 'true').length;
               progressPercentage = Math.round((completedModules / modulesCount) * 100);
             } else if (isCompleted) {
               progressPercentage = 100;
             }

             const currentStatus = isCompleted ? 'Completed' : (isUnlocked ? 'Running' : 'Locked');
             
             return (
               <LevelCard 
                 key={level.id}
                 image={level.thumbnail || (level.id == 1 ? require('../../../assets/my-level-1.png') : (level.id == 2 ? require('../../../assets/my-level-2.png') : require('../../../assets/my-level-3.png')))} 
                 title={level.title || t('levels.title_f1')} 
                 stats={t('levels.stats_format', { hours: level.duration || 4.5, modules: modulesCount })} 
                 progress={progressPercentage} 
                 status={level.status || currentStatus} 
                 badgeText={(level.status || currentStatus).toUpperCase()} 
                 buttonText={isCompleted ? t('levels.take_exam') : (isUnlocked ? t('levels.continue') : t('levels.start_level'))} 
                 buttonVariant={isCompleted ? 'primary' : (isUnlocked ? 'secondary' : 'locked')} 
                 locked={!isUnlocked}
                 rawLevel={level}
                 onPress={() => isUnlocked && handleLevelPress(level.id)}
               />
             );
           })}

          {/* Fallback/Dummy levels if API returns empty */}
          {levels.length === 0 && (
            <>
              <LevelCard image={require('../../../assets/my-level-1.png')} title={t('levels.title_f1')} stats={t('levels.stats_format', { hours: 4.5, modules: 2 })} progress={100} status="Completed" badgeText={t('levels.completed').toUpperCase()} buttonText={t('levels.take_exam')} buttonVariant="primary" onPress={() => handleLevelPress(1)} />
              <LevelCard image={require('../../../assets/my-level-2.png')} title={t('levels.title_f2')} stats={t('levels.stats_format', { hours: 4.5, modules: 2 })} progress={60} status="Running" badgeText={t('levels.running').toUpperCase()} buttonText={t('levels.continue')} buttonVariant="secondary" onPress={() => handleLevelPress(2)} />
              <LevelCard image={require('../../../assets/my-level-3.png')} title={t('levels.title_i1')} stats={t('levels.stats_format', { hours: 6.2, modules: 2 })} progress={0} status="Locked" badgeText={t('levels.locked').toUpperCase()} buttonText={t('levels.start_level')} buttonVariant="locked" locked={true} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundLight },
  header: { backgroundColor: AppColors.primaryDark, paddingBottom: hp(15) },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.SCREEN_PADDING, justifyContent: 'space-between' },
  headerIcon: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fs(20), fontWeight: '700', color: AppColors.textWhite },
  tabContainer: { flexDirection: 'row', backgroundColor: AppColors.backgroundWhite, paddingHorizontal: Spacing.SCREEN_PADDING, paddingVertical: hp(15), gap: wp(15) },
  tab: { paddingHorizontal: wp(20), paddingVertical: hp(10), borderRadius: ms(20), backgroundColor: AppColors.backgroundLight },
  tabActive: { backgroundColor: AppColors.primaryDark },
  tabLabel: { fontSize: fs(14), fontWeight: '600', color: AppColors.textSecondary },
  tabLabelActive: { color: AppColors.textWhite },
  scrollContent: { padding: Spacing.SCREEN_PADDING },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: AppColors.backgroundWhite, borderRadius: ms(20), marginBottom: hp(20), overflow: 'hidden', elevation: 4, shadowColor: AppColors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  imageContainer: { height: hp(180), width: '100%' },
  levelImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: hp(15), right: wp(15), paddingHorizontal: wp(15), paddingVertical: hp(6), borderRadius: ms(8) },
  badgeText: { fontSize: fs(12), fontWeight: '800', color: AppColors.textDark },
  cardContent: { padding: wp(20) },
  levelTitle: { fontSize: fs(17), fontWeight: '800', color: AppColors.textDark, marginBottom: hp(8), lineHeight: fs(24) },
  levelStats: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: hp(20) },
  progressContainer: { marginBottom: hp(20) },
  progressLabel: { fontSize: fs(12), fontWeight: '600', color: AppColors.textSecondary, marginBottom: hp(8) },
  progressBarTrack: { height: hp(8), backgroundColor: AppColors.backgroundLight, borderRadius: ms(4), marginBottom: hp(5) },
  progressBar: { height: '100%', borderRadius: ms(4) },
  progressPercentage: { textAlign: 'right', fontSize: fs(12), fontWeight: '700', color: AppColors.textDark },
  actionButton: { height: hp(55), borderRadius: ms(12), alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonText: { fontSize: fs(16), fontWeight: '700', color: AppColors.textWhite },
});
