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
import { fetchChapterProgress } from '../../../redux/slices/courseSlice';
import { formatImageUrl } from '../../../utils/imageUtils';
import { Image } from 'react-native';

const TopicItem = ({ topicData, isCurrent, allTopicsCompleted, assessmentId }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const isUnlocked = topicData.is_unlocked == true || topicData.is_unlocked == 1 || topicData.is_unlocked == 'true' || topicData.is_unlocked == '1' || topicData.isUnlocked == true || topicData.isUnlocked == 1;
  const isCompleted = topicData.is_completed == true || topicData.is_completed == 1 || topicData.is_completed == 'true';
  const hasQuiz = !!(topicData.assessment || topicData.assessment_id || topicData.quiz_id || (topicData.quiz && typeof topicData.quiz === 'object'));

  const handlePress = () => {
    if (!isUnlocked) return;
    router.push({
      pathname: '/(tabs)/levels/topic-details',
      params: { id: topicData.id }
    });
  };

  const handleQuizPress = () => {
    const quizId = topicData.assessment_id || topicData.quiz_id || (typeof topicData.quiz === 'object' ? topicData.quiz.id : null) || assessmentId || topicData.id;
    router.push({
      pathname: '/(tabs)/levels/exam',
      params: { id: quizId }
    });
  };

  const isContentCompleted = topicData.is_content_completed == true || topicData.is_content_completed == 'true' || topicData.is_content_completed == 1;
  const isTopicCompleted = topicData.is_completed == true || topicData.is_completed == 'true' || topicData.is_completed == 1;

  const showQuizBtn = (isContentCompleted || isTopicCompleted);

  const handleFAQPress = () => {
    router.push({
      pathname: '/(tabs)/levels/faq',
      params: { id: topicData.id, type: 'topic' }
    });
  };

  return (
    <View
      style={[
        styles.topicCard,
        isCurrent && styles.topicCardCurrent,
        !isUnlocked && styles.topicCardLocked
      ]}
    >
      <TouchableOpacity 
        style={styles.topicMainContent}
        onPress={handlePress}
        disabled={!isUnlocked}
        activeOpacity={0.8}
      >
        <View style={[styles.topicIconContainer, !isUnlocked && styles.topicIconContainerLocked]}>
          {topicData.thumbnail ? (
            <Image source={formatImageUrl(topicData.thumbnail)} style={styles.topicThumbnail} />
          ) : (
            isUnlocked ? (
              <Ionicons name="play" size={ms(22)} color="#1E3A8A" />
            ) : (
              <Ionicons name="lock-closed" size={ms(18)} color="#94A3B8" />
            )
          )}
        </View>
        <View style={styles.topicDetails}>
          <View style={styles.topicHeaderRow}>
            <Text style={styles.topicMeta}>{t('levels.topic', 'Topic')} {topicData.id}</Text>
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
            <View style={styles.badgeDuration}>
              <Ionicons name="time-outline" size={ms(10)} color="#64748B" />
              <Text style={styles.badgeDurationText}>{topicData.estimated_duration || 0} {t('common.min', 'min')}</Text>
            </View>
          </View>
          <Text style={[styles.topicTitle, !isUnlocked && { color: '#94A3B8' }]} numberOfLines={2}>{topicData.title}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButtonFAQ, !isUnlocked && styles.actionButtonFAQLocked]} 
          onPress={handleFAQPress}
          disabled={!isUnlocked}
        >
          <Ionicons 
            name="help-circle" 
            size={ms(14)} 
            color={!isUnlocked ? '#94A3B8' : '#F97316'} 
            style={{ marginRight: wp(4) }} 
          />
          <Text style={[styles.actionButtonFAQText, !isUnlocked && { color: '#94A3B8' }]}>{t('levels.faq', 'FAQ')}</Text>
        </TouchableOpacity>

        {isUnlocked ? (
          showQuizBtn && !isCompleted ? (
            <TouchableOpacity style={styles.actionButtonQuiz} onPress={handleQuizPress}>
              <Ionicons name="help-circle" size={ms(12)} color="#fff" style={{ marginRight: wp(4) }} />
              <Text style={styles.actionButtonQuizText}>{t('levels.give_quiz', 'Give Quiz')}</Text>
            </TouchableOpacity>
          ) : (
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
          )
        ) : (
          <View style={styles.actionButtonLocked}>
            <Ionicons name="lock-closed" size={ms(12)} color="#64748B" style={{ marginRight: wp(4) }} />
            <Text style={styles.actionButtonLockedText}>{t('common.locked', 'Locked')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function ChapterDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { currentChapter, currentTopics, loading } = useSelector((state) => state.course);
  const [totalDuration, setTotalDuration] = useState(0);

  const topics = currentTopics || [];
  const chapterTitle = currentChapter?.title || `Chapter ${id}`;
  const chapterDesc = currentChapter?.description || 'Chapter description';
  const assessmentId = currentChapter?.assessment_id || currentChapter?.quiz_id || null;

  // Fetch data on mount and whenever screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        dispatch(fetchChapterProgress(id));
      }
    }, [dispatch, id])
  );

  useEffect(() => {
    if (currentChapter && currentChapter.topics) {
      let duration = 0;
      currentChapter.topics.forEach(topic => {
        duration += (topic.estimated_duration || 0);
      });
      setTotalDuration(duration);
    }
  }, [currentChapter]);

  // Frontend calculation for live progress
  const completedTopicsCount = topics.filter(topic => 
    topic.is_completed == true || topic.is_completed == 1 || topic.is_completed == 'true'
  ).length;

  const totalTopicsCount = topics.length;
  const progressPercent = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  // Find first unlocked topic that is not completed
  const currentTopicIndex = topics.findIndex(topic => {
    const isUnlocked = topic.is_unlocked == true || topic.is_unlocked == 1 || topic.is_unlocked == 'true' || topic.is_unlocked == '1' || topic.isUnlocked == true || topic.isUnlocked == 1;
    const isCompleted = topic.is_completed == true || topic.is_completed == 1 || topic.is_completed == 'true';
    return isUnlocked && !isCompleted;
  });

  const nextTopicToPlay = currentTopicIndex !== -1 ? topics[currentTopicIndex] : topics[0];

  if (loading.chapterDetail) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + hp(20), paddingBottom: nextTopicToPlay ? hp(120) : hp(40) }]} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButtonCircle}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={ms(22)} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.screenTitle}>{t('levels.chapter_details', 'Chapter Details')}</Text>
            <Text style={styles.screenSubtitle}>{t('levels.track_progress', 'Track your progress through topics')}</Text>
          </View>
        </View>

        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          {currentChapter?.thumbnail ? (
            <ImageBackground
              source={formatImageUrl(currentChapter?.thumbnail)}
              style={styles.banner}
              imageStyle={styles.bannerImage}
            >
              <View style={styles.bannerOverlay}>
                <View style={styles.badgesRow}>
                  <View style={styles.badgePrimary}>
                    <Text style={styles.badgePrimaryText}>{t('levels.chapter', 'Chapter')} {id} • {totalTopicsCount} {t('levels.topics', 'Topics')} • {totalDuration} {t('common.min', 'min')}</Text>
                  </View>
                  <View style={styles.badgeSecondary}>
                    <Ionicons name="time-outline" size={ms(12)} color="#fff" />
                    <Text style={styles.badgeSecondaryText}>{t('levels.self_paced', 'Self-paced')}</Text>
                  </View>
                </View>
                <Text style={styles.bannerTitle}>{chapterTitle}</Text>
                <Text style={styles.bannerDesc}>{chapterDesc}</Text>
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
                    <Text style={styles.badgePrimaryText}>{t('levels.chapter', 'Chapter')} {id} • {totalTopicsCount} {t('levels.topics', 'Topics')} • {totalDuration} {t('common.min', 'min')}</Text>
                  </View>
                  <View style={styles.badgeSecondary}>
                    <Ionicons name="time-outline" size={ms(12)} color="#fff" />
                    <Text style={styles.badgeSecondaryText}>{t('levels.self_paced', 'Self-paced')}</Text>
                  </View>
                </View>
                <Text style={styles.bannerTitle}>{chapterTitle}</Text>
                <Text style={styles.bannerDesc}>{chapterDesc}</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
            <View style={styles.statCardHeader}>
              <View>
                <Text style={[styles.statCardTitle, { color: '#2563EB' }]}>{t('levels.chapter_progress', 'CHAPTER PROGRESS')}</Text>
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
              <Text style={styles.progressSubtext}>{completedTopicsCount} {t('levels.of', 'of')} {totalTopicsCount} {t('levels.topics_completed', 'topics completed')}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCardHalf, { borderLeftColor: '#9333EA' }]}>
              <Text style={[styles.statCardTitle, { color: '#9333EA' }]}>{t('levels.completed', 'COMPLETED')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValueSmall}>{completedTopicsCount}/{totalTopicsCount}</Text>
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
            <Text style={styles.aboutTitle}>{t('levels.about_chapter', 'About this Chapter')}</Text>
            <Text style={styles.aboutText}>{chapterDesc}</Text>
          </View>
        </View>

        {/* Topics List Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="list-outline" size={ms(18)} color="#3B82F6" style={{ marginRight: wp(8) }} />
            <Text style={styles.sectionTitle}>{t('levels.all_topics', 'All Topics')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{completedTopicsCount} {t('levels.of', 'of')} {totalTopicsCount} {t('levels.completed_label', 'completed')}</Text>
        </View>

        {/* Topics List */}
        <View style={styles.topicsList}>
          {topics.map((item, index) => (
            <TopicItem
              key={item.id}
              topicData={item}
              isCurrent={index === currentTopicIndex || (currentTopicIndex === -1 && index === 0)}
              allTopicsCompleted={completedTopicsCount === totalTopicsCount && totalTopicsCount > 0}
              assessmentId={assessmentId}
            />
          ))}

          {completedTopicsCount === totalTopicsCount && totalTopicsCount > 0 && !(currentChapter?.is_completed || currentChapter?.is_passed) && (
            <TouchableOpacity 
              style={styles.completedQuizBtn}
              onPress={() => {
                const quizIdToUse = assessmentId || topics[0]?.assessment_id || topics[0]?.quiz_id || id;
                router.push({
                  pathname: '/(tabs)/levels/exam',
                  params: { id: quizIdToUse }
                });
              }}
            >
              <Ionicons name="help-circle" size={ms(20)} color="#fff" />
              <Text style={styles.completedQuizBtnText}>{t('levels.give_chapter_quiz', 'Give Chapter Quiz')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      {completedTopicsCount === totalTopicsCount && totalTopicsCount > 0 ? (
        <View style={[styles.stickyFooter, { paddingBottom: hp(15) }]}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>{t('levels.congratulations', 'Congratulations!')}</Text>
            <Text style={styles.footerSubtitle}>{t('levels.chapter_completed', 'Chapter Completed')}</Text>
          </View>
          {assessmentId && !(currentChapter?.is_completed || currentChapter?.is_passed) ? (
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: '#D946EF' }]}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/levels/exam',
                  params: { id: assessmentId }
                });
              }}
            >
              <Text style={styles.continueBtnText}>{t('levels.give_chapter_quiz', 'Give Chapter Quiz')}</Text>
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
      ) : nextTopicToPlay && (
        <View style={[styles.stickyFooter, { paddingBottom: hp(15) }]}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>{t('levels.continue_journey', 'Continue your learning journey')}</Text>
            <Text style={styles.footerSubtitle}>{t('common.next', 'Next')}: {nextTopicToPlay.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/levels/topic-details',
                params: { id: nextTopicToPlay.id }
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
  topicsList: {
    marginBottom: hp(20),
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topicCardLocked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  topicMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  topicIconContainer: {
    width: ms(54),
    height: ms(54),
    borderRadius: ms(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
    overflow: 'hidden',
  },
  topicIconContainerLocked: {
    backgroundColor: '#E2E8F0',
  },
  topicThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topicDetails: {
    flex: 1,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    flexWrap: 'wrap',
  },
  topicMeta: {
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
    marginRight: wp(6),
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
    marginRight: wp(6),
    marginBottom: hp(2),
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
    marginRight: wp(6),
    marginBottom: hp(2),
  },
  badgeLockedText: {
    fontSize: fs(9),
    color: '#475569',
    fontWeight: '600',
    marginLeft: wp(4),
  },
  badgeDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: ms(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hp(2),
  },
  badgeDurationText: {
    fontSize: fs(9),
    color: '#64748B',
    fontWeight: '500',
    marginLeft: wp(4),
  },
  topicTitle: {
    fontSize: fs(15),
    fontWeight: '800',
    color: '#1E293B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: wp(8),
    paddingTop: hp(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButtonStart: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
  },
  actionButtonStartText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '700',
  },
  actionButtonFAQ: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: wp(10),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  actionButtonFAQLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  actionButtonFAQText: {
    color: '#F97316',
    fontSize: fs(11),
    fontWeight: '700',
  },
  actionButtonQuiz: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D946EF',
    paddingHorizontal: wp(10),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    marginLeft: wp(6),
  },
  actionButtonQuizText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '700',
  },
  actionButtonLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
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
  completedQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D946EF', // Pink
    paddingVertical: hp(15),
    borderRadius: ms(12),
    marginTop: hp(10),
    gap: wp(10),
  },
  completedQuizBtnText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '800',
  },
});
