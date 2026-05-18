import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { fetchTopicContent, toggleTopicContentRead, fetchTopicProgress } from '../../../redux/slices/courseSlice';
import i18n from '../../../i18n';

const ContentCard = ({ item, topicId, index }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [toggling, setToggling] = useState(false);

  const isRead = item.is_read == 1 || item.is_read == true || item.is_read == 'true';
  const isMedia = item.type === 'media' || item.type === 'video';

  const handleViewPress = async () => {
    // Navigate to content viewer — always show content
    const navigate = () => {
      router.push({
        pathname: '/(tabs)/levels/content-viewer',
        params: { topicId: topicId, contentId: item.id },
      });
    };

    if (isRead) {
      // Already read — just navigate, no API call
      navigate();
    } else {
      // Unread — call toggle-read API first, then navigate
      setToggling(true);
      try {
        await dispatch(toggleTopicContentRead(item.id)).unwrap();
      } catch (e) {
        // Even if API fails, still navigate
      } finally {
        setToggling(false);
        navigate();
      }
    }
  };

  return (
    <View style={[styles.card, isRead && styles.cardRead]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Ionicons
            name={isMedia ? 'videocam' : 'document-text'}
            size={ms(14)}
            color="#3B82F6"
          />
          <Text style={styles.typeBadgeText}>
            {isMedia ? t('levels.media_topic', 'MEDIA TOPIC') : t('levels.text_topic', 'TEXT TOPIC')}
          </Text>
        </View>

        {isRead ? (
          <View style={styles.statusBadgeRead}>
            <Ionicons name="checkmark-circle" size={ms(14)} color="#10B981" />
            <Text style={styles.statusTextRead}>{t('common.read', 'Read')}</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Ionicons name="ellipse-outline" size={ms(14)} color="#94A3B8" />
            <Text style={styles.statusText}>{t('common.unread', 'Unread')}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.contentTitle} numberOfLines={2}>
          {item.title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '')}
        </Text>
        <Text style={styles.contentSubtitle}>
          {t('levels.topic', 'Topic')} {index + 1}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={handleViewPress}
          disabled={toggling}
        >
          {toggling ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <>
              <Ionicons name="eye" size={ms(14)} color="#3B82F6" />
              <Text style={styles.viewButtonText}>{t('levels.view_topic', 'View Topic')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TopicDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { topicContent, currentTopic, loading } = useSelector((state) => state.course);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTopicContent({ topicId: id, lang: i18n.language, page: 1 }));
      dispatch(fetchTopicProgress(id));
    }
  }, [dispatch, id, i18n.language]);

  const contentList = topicContent?.data || [];
  const totalContent = topicContent?.total || contentList.length;

  const isAllRead = contentList.length > 0 && contentList.every(item =>
    item.is_read == 1 || item.is_read == true || item.is_read == 'true'
  );

  const topicData = currentTopic || {};
  const assessmentId = topicData.assessment_id ||
    topicData.quiz_id ||
    (topicData.assessment && topicData.assessment.id) ||
    (topicData.quiz && topicData.quiz.id) ||
    (topicData.id && (topicData.assessment_id || topicData.quiz_id || topicData.assessment || topicData.quiz) ? topicData.id : null);

  const finalAssessmentId = assessmentId || 
                            topicData.assessment_id || 
                            topicData.quiz_id || 
                            (typeof topicData.assessment === 'object' ? topicData.assessment?.id : topicData.assessment) ||
                            (typeof topicData.quiz === 'object' ? topicData.quiz?.id : topicData.quiz);

  const handleQuizPress = () => {
    const quizIdToUse = finalAssessmentId || id;
    router.push({
      pathname: '/(tabs)/levels/exam',
      params: { id: quizIdToUse }
    });
  };

  const handleSupportPress = () => {
    router.push({
      pathname: '/(tabs)/levels/support-chat',
      params: { topicId: id, topicTitle: topicData.title || '' }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={ms(20)} color="#1E3A8A" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.screenTitle}>{t('levels.learning_topics', 'Learning Topics')}</Text>
          <Text style={styles.screenSubtitle}>{t('levels.browse_materials', 'Browse through your learning materials')}</Text>
        </View>
      </View>

      {loading.topicContent && !refreshing ? (
        <View style={[styles.container, styles.loaderContainer]}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : contentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="book-outline" size={ms(60)} color="#E2E8F0" />
          </View>
          <Text style={styles.emptyTitle}>{t('levels.no_topics', 'No Topics Available')}</Text>
          <Text style={styles.emptySubtitle}>{t('levels.check_back_later', 'Check back later for new learning materials')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
            {contentList.map((item, index) => (
              <ContentCard key={item.id?.toString() || index.toString()} item={item} topicId={id} index={index} />
            ))}
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {t('common.showing', 'Showing')} {contentList.length} {t('levels.of', 'of')} {totalContent} {t('levels.topics', 'topics')}
            </Text>

            {isAllRead && finalAssessmentId && !(topicData.is_completed || topicData.is_passed) && (
              <TouchableOpacity
                style={styles.quizBtn}
                onPress={handleQuizPress}
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle" size={ms(20)} color="#fff" />
                <Text style={styles.quizBtnText}>{t('levels.start_topic_quiz', 'Start Topic Quiz')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Support Floating Action Button */}
      <TouchableOpacity 
        style={[styles.supportFab, { bottom: insets.bottom + hp(20) }]}
        onPress={handleSupportPress}
        activeOpacity={0.9}
      >
        <Ionicons name="chatbubbles" size={ms(24)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // light grayish background
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(20),
    paddingVertical: hp(15),
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    padding: ms(8),
    marginRight: wp(10),
  },
  headerTitles: {
    flex: 1,
  },
  screenTitle: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#1E3A8A', // Deep blue
    marginBottom: hp(2),
  },
  screenSubtitle: {
    fontSize: fs(12),
    color: '#475569',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: wp(20),
    paddingBottom: hp(40),
    paddingTop: hp(10),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: hp(16),
    overflow: 'hidden',
  },
  cardRead: {
    borderColor: '#10B981', // Green border for read items
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(8),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: fs(10),
    color: '#64748B',
    fontWeight: '700',
    marginLeft: wp(6),
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(20),
  },
  statusText: {
    fontSize: fs(11),
    color: '#94A3B8',
    fontWeight: '600',
    marginLeft: wp(4),
  },
  statusBadgeRead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(20),
  },
  statusTextRead: {
    fontSize: fs(11),
    color: '#10B981',
    fontWeight: '700',
    marginLeft: wp(4),
  },
  cardBody: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    minHeight: hp(70),
  },
  contentTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(6),
  },
  contentSubtitle: {
    fontSize: fs(12),
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardFooter: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(16),
    paddingTop: hp(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(11),
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: ms(8),
    backgroundColor: '#EFF6FF',
    minHeight: hp(44),
  },
  viewButtonText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: wp(6),
  },
  footerText: {
    textAlign: 'center',
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '500',
  },
  footerContainer: {
    marginTop: hp(25),
    alignItems: 'center',
    gap: hp(15),
  },
  quizBtn: {
    width: '100%',
    backgroundColor: '#D946EF', // Pink
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(16),
    borderRadius: ms(12),
    gap: wp(10),
    shadowColor: '#D946EF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quizBtnText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(40),
  },
  emptyIconContainer: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  emptyTitle: {
    fontSize: fs(20),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(20),
  },
  supportFab: {
    position: 'absolute',
    right: wp(20),
    backgroundColor: '#3B82F6',
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  }
});
