import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { fetchModuleProgress } from '../../../redux/slices/courseSlice';
import { formatImageUrl } from '../../../utils/imageUtils';

const ChapterItem = ({ chapterData, isCurrent }) => {
  const router = useRouter();
  const { t } = useTranslation();
  
  const isUnlocked = chapterData.is_unlocked == true || chapterData.is_unlocked == 1 || chapterData.is_unlocked == 'true' || chapterData.is_unlocked == '1';
  const isCompleted = chapterData.is_completed == true || chapterData.is_completed == 1 || chapterData.is_completed == 'true';

  let topicsCount = 0;
  let completedTopics = 0;
  let chapterDuration = 0;
  
  if (chapterData.topics) {
    topicsCount = chapterData.topics.length;
    chapterData.topics.forEach(topic => {
      if (topic.is_completed == true || topic.is_completed == 1 || topic.is_completed == 'true') {
        completedTopics++;
      }
      chapterDuration += (topic.estimated_duration || 0);
    });
  }

  const handlePress = () => {
    if (!isUnlocked) return;
    router.push({
      pathname: '/(tabs)/levels/chapter-details',
      params: { id: chapterData.id }
    });
  };

  return (
    <TouchableOpacity 
      style={[
        styles.chapterCard, 
        isCurrent && styles.chapterCardCurrent,
      ]}
      onPress={handlePress}
      activeOpacity={isUnlocked ? 0.9 : 1}
    >
      <View style={styles.chapterIconContainer}>
        {isUnlocked ? (
          <Ionicons name="play" size={ms(24)} color="#2563EB" />
        ) : (
          <Ionicons name="lock-closed" size={ms(20)} color="#94A3B8" />
        )}
      </View>
      <View style={styles.chapterDetails}>
        <View style={styles.chapterHeaderRow}>
          <Text style={styles.chapterMeta}>{t('levels.chapter', 'Chapter')} {chapterData.id}</Text>
          {isCurrent && !isCompleted ? (
            <View style={styles.badgeCurrent}>
              <Text style={styles.badgeCurrentText}>{t('common.current', 'Current')}</Text>
            </View>
          ) : !isUnlocked ? (
            <View style={styles.badgeLocked}>
              <Ionicons name="lock-closed" size={ms(10)} color="#475569" />
              <Text style={styles.badgeLockedText}>{t('common.locked', 'Locked')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.chapterTitle} numberOfLines={1}>{chapterData.title}</Text>
        <Text style={styles.chapterDesc} numberOfLines={1}>{chapterData.description || `${chapterData.title} description`}</Text>
        <Text style={styles.chapterCounts}>{topicsCount} {t('levels.topics', 'topics')} • {completedTopics} {t('levels.completed_label', 'completed')} • {chapterDuration} {t('common.min', 'min')}</Text>
      </View>
      
      {isUnlocked ? (
        <TouchableOpacity style={styles.actionButtonStart} onPress={handlePress}>
          <Text style={styles.actionButtonStartText}>{t('common.start', 'Start')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtonLocked}>
          <Text style={styles.actionButtonLockedText}>{t('common.locked', 'Locked')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ModuleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { currentModule, currentChapters, loading } = useSelector((state) => state.course);
  const [totalDuration, setTotalDuration] = useState(0);
  const [completedChapters, setCompletedChapters] = useState(0);
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);
  
  const chapters = currentChapters || [];
  const moduleTitle = currentModule?.title || `Module ${id}`;
  const moduleDesc = currentModule?.description || 'Module description';

  useEffect(() => {
    if (id) {
      dispatch(fetchModuleProgress(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentModule && currentModule.chapters) {
      let duration = 0;
      let completedCount = 0;
      let totalTopics = 0;
      
      currentModule.chapters.forEach(c => {
        if (c.is_completed == true || c.is_completed == 1) completedCount++;
        
        if (c.topics) {
          totalTopics += c.topics.length;
          c.topics.forEach(topic => {
            duration += (topic.estimated_duration || 0);
          });
        }
      });
      
      setTotalDuration(duration);
      setCompletedChapters(completedCount);
      setTotalTopicsCount(totalTopics);
    }
  }, [currentModule]);

  const totalChaptersCount = chapters.length;
  const progressPercent = totalChaptersCount > 0 ? Math.round((completedChapters / totalChaptersCount) * 100) : 0;
  
  // Find first unlocked chapter that is not completed
  const currentChapterIndex = chapters.findIndex(c => {
    const isUnlocked = c.is_unlocked == true || c.is_unlocked == 1 || c.is_unlocked == 'true' || c.is_unlocked == '1';
    const isCompleted = c.is_completed == true || c.is_completed == 1 || c.is_completed == 'true';
    return isUnlocked && !isCompleted;
  });

  const nextChapterToPlay = currentChapterIndex !== -1 ? chapters[currentChapterIndex] : chapters[0];

  if (loading.moduleDetail) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + hp(20), paddingBottom: nextChapterToPlay ? hp(120) : hp(40) }]} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButtonCircle} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={ms(22)} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.screenTitle}>{t('modules.details_title', 'Module Details')}</Text>
            <Text style={styles.screenSubtitle}>{t('modules.track_progress', 'Track your progress through chapters')}</Text>
          </View>
        </View>

        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <ImageBackground 
            source={formatImageUrl(currentModule?.thumbnail) || require('../../../assets/subtitle-1.png')} 
            style={styles.banner}
            imageStyle={styles.bannerImage}
          >

            <View style={styles.bannerOverlay}>
              <View style={styles.badgesRow}>
                <View style={styles.badgePrimary}>
                  <Text style={styles.badgePrimaryText}>{t('modules.module_number', { number: id })} • {totalChaptersCount} {t('levels.chapters', 'Chapters')} • {totalTopicsCount} {t('levels.topics', 'Topics')}</Text>
                </View>
                <View style={styles.badgeSecondary}>
                  <Ionicons name="time-outline" size={ms(12)} color="#fff" />
                  <Text style={styles.badgeSecondaryText}>{t('levels.self_paced', 'Self-paced')}</Text>
                </View>
              </View>
              <Text style={styles.bannerTitle}>{moduleTitle}</Text>
              <Text style={styles.bannerDesc}>{moduleDesc}</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
            <View style={styles.statCardHeader}>
              <View>
                <Text style={[styles.statCardTitle, { color: '#2563EB' }]}>{t('levels.chapter_progress', 'MODULE PROGRESS')}</Text>
                <Text style={styles.statCardValue}>{progressPercent}%</Text>
              </View>
              <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="trending-up" size={ms(20)} color="#2563EB" />
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: '#2563EB' }]} />
              </View>
              <Text style={styles.progressSubtext}>{t('modules.chapter_complete', { completed: completedChapters, total: totalChaptersCount })}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCardHalf, { borderLeftColor: '#9333EA' }]}>
              <Text style={[styles.statCardTitle, { color: '#9333EA' }]}>{t('common.completed', 'COMPLETED')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValueSmall}>{completedChapters}/{totalChaptersCount}</Text>
                <Ionicons name="ribbon-outline" size={ms(18)} color="#9333EA" />
              </View>
            </View>

            <View style={[styles.statCardHalf, { borderLeftColor: '#16A34A' }]}>
              <Text style={[styles.statCardTitle, { color: '#16A34A' }]}>{t('levels.est_time', 'EST. TIME')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValueSmall}>{totalDuration} {t('common.min', 'min')}</Text>
                <Ionicons name="time-outline" size={ms(18)} color="#16A34A" />
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutBox}>
          <View style={styles.aboutIcon}>
            <Ionicons name="book-outline" size={ms(20)} color="#2563EB" />
          </View>
          <View style={styles.aboutContent}>
            <Text style={styles.aboutTitle}>{t('modules.about_module', 'About this Module')}</Text>
            <Text style={styles.aboutText}>{moduleDesc}</Text>
          </View>
        </View>

        {/* Chapters List Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="document-text-outline" size={ms(18)} color="#3B82F6" style={{ marginRight: wp(8) }} />
            <Text style={styles.sectionTitle}>{t('modules.all_chapters', 'All Chapters')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t('modules.chapter_complete', { completed: completedChapters, total: totalChaptersCount })}</Text>
        </View>

        {/* Chapters List */}
        <View style={styles.chaptersList}>
          {chapters.map((item, index) => (
            <ChapterItem 
              key={item.id}
              chapterData={item}
              isCurrent={index === currentChapterIndex || (currentChapterIndex === -1 && index === 0)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      {nextChapterToPlay && (
        <View style={[styles.stickyFooter, { paddingBottom: hp(15) }]}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>{t('levels.continue_journey', 'Continue your learning journey')}</Text>
            <Text style={styles.footerSubtitle}>{t('common.next', 'Next')}: {nextChapterToPlay.title}</Text>
          </View>
          <TouchableOpacity 
            style={styles.continueBtn}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/levels/chapter-details',
                params: { id: nextChapterToPlay.id }
              });
            }}
          >
            <Text style={styles.continueBtnText}>{t('levels.continue_learning', 'Continue Learning')}</Text>
            <Ionicons name="chevron-forward" size={ms(16)} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: wp(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(25),
  },
  backButtonCircle: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#1E293B',
  },
  screenSubtitle: {
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '500',
  },
  bannerContainer: {
    borderRadius: ms(20),
    overflow: 'hidden',
    marginBottom: hp(25),
  },
  banner: {
    width: '100%',
    height: hp(220),
    justifyContent: 'space-between',
  },
  bannerImage: {
    resizeMode: 'cover',
  },
  bannerOverlay: {
    padding: ms(20),
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: hp(40),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  badgePrimary: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
    marginRight: wp(10),
  },
  badgePrimaryText: {
    color: '#fff',
    fontSize: fs(11),
    fontWeight: '700',
  },
  badgeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  badgeSecondaryText: {
    color: '#fff',
    fontSize: fs(11),
    fontWeight: '600',
    marginLeft: wp(4),
  },
  bannerTitle: {
    fontSize: fs(28),
    color: '#fff',
    fontWeight: '800',
    marginBottom: hp(4),
  },
  bannerDesc: {
    fontSize: fs(14),
    color: '#E2E8F0',
    fontWeight: '500',
  },
  statsSection: {
    marginTop: hp(25),
    marginBottom: hp(25),
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(15),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  statCardTitle: {
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: hp(6),
  },
  statCardValue: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#1E293B',
  },
  statIconBadge: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: hp(10),
  },
  progressBarTrack: {
    height: hp(10),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(5),
    marginBottom: hp(12),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: ms(5),
  },
  progressSubtext: {
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '600',
    marginTop: hp(4),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(15),
  },
  statCardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(10),
  },
  statCardValueSmall: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1E293B',
  },
  aboutBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: hp(25),
    backgroundColor: '#F8FAFC',
  },
  aboutIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(8),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(4),
  },
  aboutText: {
    fontSize: fs(12),
    color: '#64748B',
    lineHeight: fs(18),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(15),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '500',
  },
  chaptersList: {
    marginBottom: hp(20),
  },
  chapterCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: hp(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chapterCardCurrent: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  chapterIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(12),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(16),
  },
  chapterDetails: {
    flex: 1,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    flexWrap: 'wrap',
  },
  chapterMeta: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '600',
    marginRight: wp(6),
    marginBottom: hp(2),
  },
  badgeCurrent: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: ms(4),
    marginBottom: hp(2),
  },
  badgeCurrentText: {
    fontSize: fs(9),
    color: '#2563EB',
    fontWeight: '700',
  },
  badgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: ms(4),
    marginBottom: hp(2),
  },
  badgeLockedText: {
    fontSize: fs(9),
    color: '#475569',
    fontWeight: '600',
    marginLeft: wp(4),
  },
  chapterTitle: {
    fontSize: fs(15),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(4),
  },
  chapterDesc: {
    fontSize: fs(12),
    color: '#64748B',
    marginBottom: hp(6),
  },
  chapterCounts: {
    fontSize: fs(11),
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionButtonStart: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    marginLeft: wp(8),
  },
  actionButtonStartText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '700',
  },
  actionButtonLocked: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    marginLeft: wp(8),
  },
  actionButtonLockedText: {
    color: '#64748B',
    fontSize: fs(12),
    fontWeight: '600',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(20),
    paddingVertical: hp(15),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: hp(2),
  },
  footerSubtitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#1E293B',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
    borderRadius: ms(8),
  },
  continueBtnText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
    marginRight: wp(6),
  },
});
