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
import { fetchChapterProgress } from '../../../redux/slices/courseSlice';

const TopicItem = ({ topicData, isCurrent, allTopicsCompleted, assessmentId }) => {
  const router = useRouter();
  const { t } = useTranslation();
  
  const isUnlocked = topicData.is_unlocked == true || topicData.is_unlocked == 1 || topicData.is_unlocked == 'true' || topicData.is_unlocked == '1' || topicData.isUnlocked == true || topicData.isUnlocked == 1;
  const isCompleted = topicData.is_completed == true || topicData.is_completed == 1 || topicData.is_completed == 'true';

  const handlePress = () => {
    if (!isUnlocked) return;
    router.push({
      pathname: '/(tabs)/levels/topic-details',
      params: { id: topicData.id }
    });
  };

  const handleQuizPress = () => {
    router.push({
      pathname: '/(tabs)/levels/exam',
      params: { id: assessmentId || topicData.assessment_id || topicData.id }
    });
  };

  // Show Give Quiz button when all topic content is read AND a quiz is available
  const isContentCompleted = topicData.is_content_completed == true || topicData.is_content_completed == 'true' || topicData.is_content_completed == 1;
  const isQuizAvailable = topicData.is_quiz_available == true || topicData.is_quiz_available == 'true' || topicData.is_quiz_available == 1;
  
  const showQuizBtn = isContentCompleted && isQuizAvailable;

  return (
    <TouchableOpacity 
      style={[
        styles.topicCard, 
        isCurrent && styles.topicCardCurrent,
      ]}
      onPress={handlePress}
      activeOpacity={isUnlocked ? 0.9 : 1}
    >
      <View style={styles.topicIconContainer}>
        {isUnlocked ? (
          <Ionicons name="play" size={ms(24)} color="#1E3A8A" />
        ) : (
          <Ionicons name="lock-closed" size={ms(20)} color="#94A3B8" />
        )}
      </View>
      <View style={styles.topicDetails}>
        <View style={styles.topicHeaderRow}>
          <Text style={styles.topicMeta}>Topic {topicData.id}</Text>
          {isCurrent && !isCompleted ? (
            <View style={styles.badgeCurrent}>
              <Text style={styles.badgeCurrentText}>Current</Text>
            </View>
          ) : !isUnlocked ? (
            <View style={styles.badgeLocked}>
              <Ionicons name="lock-closed" size={ms(10)} color="#475569" />
              <Text style={styles.badgeLockedText}>Locked</Text>
            </View>
          ) : null}
          <View style={styles.badgeDuration}>
            <Ionicons name="time-outline" size={ms(10)} color="#64748B" />
            <Text style={styles.badgeDurationText}>{topicData.estimated_duration || 0} min</Text>
          </View>
        </View>
        <Text style={styles.topicTitle} numberOfLines={1}>{topicData.title}</Text>
      </View>
      
      <View style={styles.actionButtonsRow}>
        {showQuizBtn ? (
          <TouchableOpacity style={styles.actionButtonQuiz} onPress={handleQuizPress}>
            <Ionicons name="help-circle" size={ms(12)} color="#fff" style={{ marginRight: wp(4) }} />
            <Text style={styles.actionButtonQuizText}>Give Quiz</Text>
          </TouchableOpacity>
        ) : null}
        {isUnlocked ? (
          <TouchableOpacity style={styles.actionButtonStart} onPress={handlePress}>
            <Text style={styles.actionButtonStartText}>Start Topic</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtonLocked}>
            <Text style={styles.actionButtonLockedText}>Locked</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  const [completedTopics, setCompletedTopics] = useState(0);
  
  const topics = currentTopics || [];
  const chapterTitle = currentChapter?.title || `Chapter ${id}`;
  const chapterDesc = currentChapter?.description || 'Chapter description';
  const assessmentId = currentChapter?.assessment_id || currentChapter?.quiz_id || null;

  useEffect(() => {
    if (id) {
      dispatch(fetchChapterProgress(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentChapter && currentChapter.topics) {
      let duration = 0;
      let completedCount = 0;
      
      currentChapter.topics.forEach(topic => {
        if (topic.is_completed == true || topic.is_completed == 1) completedCount++;
        duration += (topic.estimated_duration || 0);
      });
      
      setTotalDuration(duration);
      setCompletedTopics(completedCount);
    }
  }, [currentChapter]);

  const totalTopicsCount = topics.length;
  const progressPercent = totalTopicsCount > 0 ? Math.round((completedTopics / totalTopicsCount) * 100) : 0;
  
  // Find first unlocked topic that is not completed
  const currentTopicIndex = topics.findIndex(t => {
    const isUnlocked = t.is_unlocked == true || t.is_unlocked == 1 || t.is_unlocked == 'true' || t.is_unlocked == '1' || t.isUnlocked == true || t.isUnlocked == 1;
    const isCompleted = t.is_completed == true || t.is_completed == 1 || t.is_completed == 'true';
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
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + hp(20), paddingBottom: nextTopicToPlay ? hp(120) + insets.bottom : hp(40) + insets.bottom }]} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButtonCircle} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={ms(22)} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.screenTitle}>Chapter Details</Text>
            <Text style={styles.screenSubtitle}>Track your progress through topics</Text>
          </View>
        </View>

        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <ImageBackground 
            source={currentChapter?.thumbnail ? { uri: currentChapter.thumbnail } : require('../../../assets/topic-details-2.png')} 
            style={styles.banner}
            imageStyle={styles.bannerImage}
          >

            <View style={styles.bannerOverlay}>
              <View style={styles.badgesRow}>
                <View style={styles.badgePrimary}>
                  <Text style={styles.badgePrimaryText}>Chapter {id} • {totalTopicsCount} Topics • {totalDuration} min</Text>
                </View>
                <View style={styles.badgeSecondary}>
                  <Ionicons name="time-outline" size={ms(12)} color="#fff" />
                  <Text style={styles.badgeSecondaryText}>Self-paced</Text>
                </View>
              </View>
              <Text style={styles.bannerTitle}>{chapterTitle}</Text>
              <Text style={styles.bannerDesc}>{chapterDesc}</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
            <View style={styles.statCardHeader}>
              <View>
                <Text style={[styles.statCardTitle, { color: '#2563EB' }]}>CHAPTER PROGRESS</Text>
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
              <Text style={styles.progressSubtext}>{completedTopics} of {totalTopicsCount} topics completed</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCardHalf, { borderLeftColor: '#9333EA' }]}>
              <Text style={[styles.statCardTitle, { color: '#9333EA' }]}>COMPLETED</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValueSmall}>{completedTopics}/{totalTopicsCount}</Text>
                <Ionicons name="ribbon-outline" size={ms(18)} color="#9333EA" />
              </View>
            </View>

            <View style={[styles.statCardHalf, { borderLeftColor: '#16A34A' }]}>
              <Text style={[styles.statCardTitle, { color: '#16A34A' }]}>EST. TIME</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValueSmall}>{totalDuration} min</Text>
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
            <Text style={styles.aboutTitle}>About this Chapter</Text>
            <Text style={styles.aboutText}>{chapterDesc}</Text>
          </View>
        </View>

        {/* Topics List Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="list-outline" size={ms(18)} color="#3B82F6" style={{ marginRight: wp(8) }} />
            <Text style={styles.sectionTitle}>All Topics</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{completedTopics} of {totalTopicsCount} completed</Text>
        </View>

        {/* Topics List */}
        <View style={styles.topicsList}>
          {topics.map((item, index) => (
            <TopicItem 
              key={item.id}
              topicData={item}
              isCurrent={index === currentTopicIndex || (currentTopicIndex === -1 && index === 0)}
              allTopicsCompleted={completedTopics === totalTopicsCount && totalTopicsCount > 0}
              assessmentId={assessmentId}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      {completedTopics === totalTopicsCount && totalTopicsCount > 0 ? (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + hp(15) : hp(15) }]}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>Congratulations!</Text>
            <Text style={styles.footerSubtitle}>Chapter Completed</Text>
          </View>
          {assessmentId ? (
            <TouchableOpacity 
              style={[styles.continueBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/levels/exam',
                  params: { id: assessmentId }
                });
              }}
            >
              <Text style={styles.continueBtnText}>Give Chapter Quiz</Text>
              <Ionicons name="help-circle" size={ms(16)} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.continueBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.continueBtnText}>Go Back</Text>
              <Ionicons name="arrow-back" size={ms(16)} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : nextTopicToPlay && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + hp(15) : hp(15) }]}>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>Continue your learning journey</Text>
            <Text style={styles.footerSubtitle}>Next: {nextTopicToPlay.title}</Text>
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
            <Text style={styles.continueBtnText}>Continue Learning</Text>
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: hp(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicCardCurrent: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  topicIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(12),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(16),
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
  },
  actionButtonStart: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
    marginLeft: wp(6),
  },
  actionButtonStartText: {
    color: '#FFFFFF',
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
