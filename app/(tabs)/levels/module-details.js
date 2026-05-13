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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { fetchModuleProgress } from '../../../redux/slices/courseSlice';
import { formatImageUrl } from '../../../utils/imageUtils';
import { Image } from 'react-native';
import HtmlContent from '../../../components/HtmlContent';

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

  const handleFAQPress = () => {
    router.push({
      pathname: '/(tabs)/levels/faq',
      params: { id: chapterData.id, type: 'chapter' }
    });
  };

  return (
    <View style={[
      styles.chapterCard, 
      isCurrent && styles.chapterCardCurrent,
      !isUnlocked && styles.chapterCardLocked
    ]}>
      <TouchableOpacity 
        style={[styles.chapterIconContainer, !isUnlocked && styles.chapterIconContainerLocked]}
        onPress={handlePress}
        disabled={!isUnlocked}
        activeOpacity={0.8}
      >
        {chapterData.thumbnail ? (
          <Image source={formatImageUrl(chapterData.thumbnail)} style={styles.chapterThumbnail} />
        ) : (
          isUnlocked ? (
            <Ionicons name="play" size={ms(24)} color="#2563EB" />
          ) : (
            <Ionicons name="lock-closed" size={ms(20)} color="#94A3B8" />
          )
        )}
      </TouchableOpacity>
      <View style={styles.chapterDetails}>
        <View style={styles.chapterHeaderRow}>
          <Text style={styles.chapterMeta}>{t('levels.chapter', 'Chapter')} {chapterData.id}</Text>
          {isCompleted ? (
            <View style={styles.badgeCompleted}>
              <Ionicons name="checkmark-circle" size={ms(10)} color="#10B981" />
              <Text style={styles.badgeCompletedText}>{t('common.completed', 'Completed')}</Text>
            </View>
          ) : isCurrent ? (
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
        <Text style={[styles.chapterTitle, !isUnlocked && { color: '#94A3B8' }]} numberOfLines={1}>{chapterData.title}</Text>
        <Text style={styles.chapterDesc} numberOfLines={1}>{chapterData.description || `${chapterData.title} description`}</Text>
        <Text style={styles.chapterCounts}>{topicsCount} {t('levels.topics', 'topics')} • {completedTopics} {t('levels.completed_label', 'completed')} • {chapterDuration} {t('common.min', 'min')}</Text>
      </View>
      
      <View style={styles.chapterActionsColumn}>
        <TouchableOpacity 
          style={[styles.faqSmallButton, !isUnlocked && styles.faqSmallButtonLocked]} 
          onPress={handleFAQPress}
          disabled={!isUnlocked}
        >
          <Ionicons 
            name="help-circle" 
            size={ms(14)} 
            color={!isUnlocked ? '#94A3B8' : '#F59E0B'} 
          />
          <Text style={[styles.faqSmallButtonText, !isUnlocked && { color: '#94A3B8' }]}>FAQ</Text>
        </TouchableOpacity>

        {isUnlocked ? (
          <TouchableOpacity 
            style={[
              styles.actionButtonStart,
              isCompleted && { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }
            ]} 
            onPress={handlePress}
          >
            <Text style={[styles.actionButtonStartText, isCompleted && { color: '#2563EB' }]}>
              {isCompleted ? t('common.view', 'View') : t('levels.continue', 'Continue')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtonLocked}>
            <Text style={styles.actionButtonLockedText}>{t('common.locked', 'Locked')}</Text>
          </View>
        )}
      </View>
    </View>
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
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);
  
  const chapters = currentChapters || [];
  const moduleTitle = currentModule?.title || `Module ${id}`;
  const moduleDesc = currentModule?.description || 'Module description';
  const assessmentId = currentModule?.assessment?.id || currentModule?.assessment_id || null;

  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        dispatch(fetchModuleProgress(id));
      }
    }, [dispatch, id])
  );

  useEffect(() => {
    if (currentModule && currentModule.chapters) {
      let duration = 0;
      let totalTopics = 0;
      
      currentModule.chapters.forEach(c => {
        if (c.topics) {
          totalTopics += c.topics.length;
          c.topics.forEach(topic => {
            duration += (topic.estimated_duration || 0);
          });
        }
      });
      
      setTotalDuration(duration);
      setTotalTopicsCount(totalTopics);
    }
  }, [currentModule]);

  // Frontend calculation for live progress
  const completedChaptersCount = chapters.filter(c => 
    c.is_completed == true || c.is_completed == 1 || c.is_completed == 'true'
  ).length;

  const totalChaptersCount = chapters.length;
  const progressPercent = totalChaptersCount > 0 ? Math.round((completedChaptersCount / totalChaptersCount) * 100) : 0;
  
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
          {currentModule?.thumbnail ? (
            <ImageBackground 
              source={formatImageUrl(currentModule?.thumbnail)} 
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
          ) : (
            <LinearGradient 
              colors={['#0F172A', '#1E40AF', '#0D9488']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={styles.banner}
            >
              <View style={[styles.bannerOverlay, { backgroundColor: 'transparent' }]}>
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
            </LinearGradient>
          )}
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
              <Text style={styles.progressSubtext}>{t('modules.chapter_complete', { completed: completedChaptersCount, total: totalChaptersCount })}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCardHalf, { borderLeftColor: '#9333EA' }]}>
              <Text style={[styles.statCardTitle, { color: '#9333EA' }]}>{t('common.completed', 'COMPLETED')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValueSmall}>{completedChaptersCount}/{totalChaptersCount}</Text>
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
            <HtmlContent html={moduleDesc} baseStyle={{ fontSize: fs(12) }} />
          </View>
        </View>

        {/* Chapters List Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="document-text-outline" size={ms(18)} color="#3B82F6" style={{ marginRight: wp(8) }} />
            <Text style={styles.sectionTitle}>{t('modules.all_chapters', 'All Chapters')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t('modules.chapter_complete', { completed: completedChaptersCount, total: totalChaptersCount })}</Text>
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

          {completedChaptersCount === totalChaptersCount && totalChaptersCount > 0 && assessmentId && !(currentModule?.is_completed || currentModule?.is_passed) && (
            <TouchableOpacity 
              style={styles.completedQuizBtn}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/levels/exam',
                  params: { id: assessmentId }
                });
              }}
            >
              <Ionicons name="help-circle" size={ms(20)} color="#fff" />
              <Text style={styles.completedQuizBtnText}>{t('levels.take_exam', 'Take Module Quiz')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      {completedChaptersCount === totalChaptersCount && totalChaptersCount > 0 ? (
        <View style={[styles.stickyFooter, { paddingBottom: hp(15) }]}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>{t('levels.congratulations', 'Congratulations!')}</Text>
            <Text style={styles.footerSubtitle}>{t('modules.module_completed', 'Module Completed')}</Text>
          </View>
          {assessmentId && !(currentModule?.is_completed || currentModule?.is_passed) ? (
            <TouchableOpacity 
              style={[styles.continueBtn, { backgroundColor: '#D946EF' }]}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/levels/exam',
                  params: { id: assessmentId }
                });
              }}
            >
              <Text style={styles.continueBtnText}>{t('levels.take_exam', 'Take Module Quiz')}</Text>
              <Ionicons name="help-circle" size={ms(16)} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.continueBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.continueBtnText}>{t('common.go_back', 'Go Back')}</Text>
              <Ionicons name="arrow-back" size={ms(16)} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : nextChapterToPlay && (
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
    padding: ms(12),
    marginBottom: hp(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chapterCardCurrent: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  chapterCardLocked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  chapterIconContainer: {
    width: ms(54),
    height: ms(54),
    borderRadius: ms(12),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
    overflow: 'hidden',
  },
  chapterIconContainerLocked: {
    backgroundColor: '#F1F5F9',
  },
  chapterThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  badgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: ms(4),
    marginBottom: hp(2),
    marginRight: wp(6),
  },
  badgeCompletedText: {
    fontSize: fs(9),
    color: '#10B981',
    fontWeight: '700',
    marginLeft: wp(4),
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
    backgroundColor: '#10B981',
    paddingHorizontal: wp(10),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    minWidth: wp(80),
    alignItems: 'center',
  },
  actionButtonStartText: {
    color: '#FFFFFF',
    fontSize: fs(12),
    fontWeight: '700',
  },
  actionButtonLocked: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(10),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    minWidth: wp(80),
    alignItems: 'center',
  },
  actionButtonLockedText: {
    color: '#64748B',
    fontSize: fs(12),
    fontWeight: '600',
  },
  chapterActionsColumn: {
    gap: hp(8),
    alignItems: 'flex-end',
  },
  faqSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: wp(8),
    paddingVertical: hp(6),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    minWidth: wp(80),
    justifyContent: 'center',
  },
  faqSmallButtonLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  faqSmallButtonText: {
    color: '#F59E0B',
    fontSize: fs(11),
    fontWeight: '700',
    marginLeft: wp(4),
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
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  footerTextContainer: {
    flex: 1,
    marginRight: wp(15),
  },
  footerTitle: {
    fontSize: fs(11),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: hp(2),
  },
  footerSubtitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#1E293B',
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
    borderRadius: ms(12),
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '700',
    marginRight: wp(8),
  },
  completedQuizBtn: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(15),
    borderRadius: ms(12),
    marginTop: hp(20),
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completedQuizBtnText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '700',
    marginLeft: wp(8),
  },
});
