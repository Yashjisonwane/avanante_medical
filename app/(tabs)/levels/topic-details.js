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
import { fetchTopicContent, toggleTopicContentRead } from '../../../redux/slices/courseSlice';
import i18n from '../../../i18n';

const ContentCard = ({ item, topicId }) => {
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
          {item.title}
        </Text>
        <Text style={styles.contentSubtitle}>
          {t('levels.topic', 'Topic')} {item.order || item.id}
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
  
  const { topicContent, loading } = useSelector((state) => state.course);

  useEffect(() => {
    if (id) {
      dispatch(fetchTopicContent({ topicId: id, lang: i18n.language, page: 1 }));
    }
  }, [dispatch, id, i18n.language]);

  if (loading.topicContent) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const contentList = topicContent?.data || [];

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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {contentList.map((item, index) => (
            <ContentCard key={item.id?.toString() || index.toString()} item={item} topicId={id} />
          ))}
        </View>
        
        {contentList.length > 0 && (
          <Text style={styles.footerText}>
            {t('common.showing', 'Showing')} {contentList.length} {t('levels.of', 'of')} {topicContent?.total || contentList.length} {t('levels.topics', 'topics')}
          </Text>
        )}
      </ScrollView>
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
    marginTop: hp(20),
    fontWeight: '500',
  },
});
