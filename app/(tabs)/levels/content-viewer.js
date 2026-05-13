import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useVideoPlayer, VideoView } from 'expo-video';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { fetchSinglePreview, toggleTopicContentRead } from '../../../redux/slices/courseSlice';
import { formatImageUrl } from '../../../utils/imageUtils';
import HtmlContent from '../../../components/HtmlContent';

const HtmlRenderer = ({ html }) => {
  const { width } = useWindowDimensions();
  // subtract screen margins (wp(12)*2 = wp(24)) AND contentBox padding (ms(12)*2)
  const availableWidth = width - wp(24) - ms(12) * 2;
  
  return (
    <HtmlContent 
      html={html} 
      containerWidth={availableWidth}
    />
  );
};

const VideoPlayer = ({ url }) => {
  const player = useVideoPlayer(url, (player) => {
    player.play();
  });

  return (
    <VideoView
      style={styles.videoPlayer}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function ContentViewerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topicId, contentId } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { singlePreview, loading } = useSelector((state) => state.course);
  const [lastMarkedId, setLastMarkedId] = useState(null);

  useEffect(() => {
    if (topicId && contentId) {
      dispatch(fetchSinglePreview({ topicId, contentId }));
    }
  }, [dispatch, topicId, contentId]);

  const topicData   = singlePreview?.topic     || {};
  const contentData = singlePreview?.current   || {};
  const navigation  = singlePreview?.navigation || {};

  const isRead  =
    contentData.is_read == 1 ||
    contentData.is_read == true ||
    contentData.is_read == 'true';

  // Auto mark as read ONLY if unread and not already attempted for this contentId
  useEffect(() => {
    if (contentId && singlePreview && !isRead && lastMarkedId !== contentId) {
      setLastMarkedId(contentId);
      dispatch(toggleTopicContentRead(Number(contentId)));
    }
  }, [contentId, isRead, singlePreview]);

  const isMedia = contentData.type === 'media' || contentData.type === 'video';
  const prevId = navigation.previous_content_id || null;
  const nextId = navigation.next_content_id     || null;

  if (loading.singlePreview) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const handleMarkRead = async () => {
    if (isRead) return;
    try {
      await dispatch(toggleTopicContentRead(Number(contentId))).unwrap();
      dispatch(fetchSinglePreview({ topicId, contentId }));
    } catch (e) {
      // ignore
    }
  };

  const handlePrev = () => {
    if (prevId) {
      router.replace({
        pathname: '/(tabs)/levels/content-viewer',
        params: { topicId, contentId: prevId },
      });
    }
  };

  const handleNext = () => {
    if (nextId) {
      router.replace({
        pathname: '/(tabs)/levels/content-viewer',
        params: { topicId, contentId: nextId },
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.breadcrumbLink} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={ms(16)} color="#64748B" />
          <Text style={styles.breadcrumbText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbText} numberOfLines={1}>
          {topicData.title || `Topic ${topicId}`}
        </Text>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={[styles.breadcrumbText, styles.breadcrumbActive]} numberOfLines={1}>
          {contentData.title || '...'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(30) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={isMedia ? 'videocam' : 'book'}
              size={ms(14)}
              color="#3B82F6"
            />
            <Text style={styles.typeBadgeText}>
              {isMedia ? 'MEDIA MATERIAL' : 'READING MATERIAL'}
            </Text>
          </View>

          {isRead ? (
            <View style={styles.readBadge}>
              <Ionicons name="checkmark-circle" size={ms(14)} color="#10B981" />
              <Text style={styles.readBadgeText}>Read</Text>
            </View>
          ) : (
            <View style={styles.unreadBadge}>
              <Ionicons name="ellipse-outline" size={ms(14)} color="#94A3B8" />
              <Text style={styles.unreadBadgeText}>Unread</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{contentData.title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '') || 'Untitled'}</Text>

        <View style={styles.contentBox}>
          {/* 1. Render Media Section (Video or Image) if available */}
          {isMedia && contentData?.media?.full_url && (
            <View style={styles.videoWrapper}>
              <VideoPlayer url={contentData.media.full_url} />
              <Text style={styles.mediaTitle}>{contentData.media.title}</Text>
              {contentData.media.description && (
                <Text style={styles.mediaDescription}>{contentData.media.description}</Text>
              )}
              {/* Divider if there is also text content below */}
              {contentData.content && <View style={styles.contentDivider} />}
            </View>
          )}

          {/* 2. Render HTML Content (Text, Tables, Images) if available */}
          {contentData.content ? (
            <HtmlRenderer html={contentData.content} />
          ) : !isMedia ? (
            <Text style={styles.emptyContent}>No content available.</Text>
          ) : null}
        </View>

        {/* Auto-marking logic handles this now */}
        {!isRead && (
          <View style={styles.markingReadIndicator}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.markingReadText}>Marking progress...</Text>
          </View>
        )}

        <View style={styles.navFooter}>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrev, !prevId && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={!prevId}
          >
            <Ionicons name="arrow-back" size={ms(18)} color={prevId ? '#64748B' : '#CBD5E1'} />
            <Text style={[styles.navBtnValue, !prevId && { color: '#CBD5E1' }]}>
              Previous
            </Text>
          </TouchableOpacity>

          <Text style={styles.navCenterText}>
            {nextId ? 'Next lesson →' : 'Last lesson'}
          </Text>

          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnNext, !nextId && styles.navBtnDisabledNext]}
            onPress={handleNext}
            disabled={!nextId}
          >
            <Text style={[styles.navBtnValueNext, !nextId && { color: '#BFDBFE' }]}>
              Next
            </Text>
            <Ionicons
              name="arrow-forward"
              size={ms(18)}
              color={nextId ? '#FFFFFF' : '#BFDBFE'}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '600',
    marginLeft: wp(2),
    maxWidth: wp(90),
  },
  breadcrumbSeparator: {
    fontSize: fs(12),
    color: '#CBD5E1',
    marginHorizontal: wp(6),
  },
  breadcrumbActive: {
    color: '#1E293B',
    flex: 1,
  },
  scrollContent: {
    padding: wp(12),
    paddingTop: hp(10),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(12),
    gap: wp(8),
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: ms(8),
    paddingHorizontal: wp(10),
    paddingVertical: hp(6),
  },
  typeBadgeText: {
    fontSize: fs(10),
    color: '#3B82F6',
    fontWeight: '700',
    marginLeft: wp(6),
    letterSpacing: 0.4,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: ms(8),
    paddingHorizontal: wp(10),
    paddingVertical: hp(6),
  },
  readBadgeText: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '700',
    marginLeft: wp(5),
    letterSpacing: 0.4,
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(8),
    paddingHorizontal: wp(10),
    paddingVertical: hp(6),
  },
  unreadBadgeText: {
    fontSize: fs(10),
    color: '#94A3B8',
    fontWeight: '700',
    marginLeft: wp(5),
    letterSpacing: 0.4,
  },
  title: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(4),
    lineHeight: fs(32),
  },
  subtitle: {
    fontSize: fs(14),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: hp(18),
  },
  contentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ms(12),
    marginBottom: hp(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyContent: {
    fontSize: fs(14),
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: hp(40),
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(180),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(12),
  },
  mediaPlaceholderText: {
    marginTop: hp(10),
    fontSize: fs(14),
    color: '#64748B',
    fontWeight: '500',
  },
  markingReadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: ms(12),
    paddingVertical: hp(12),
    marginBottom: hp(25),
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  markingReadText: {
    fontSize: fs(13),
    color: '#10B981',
    fontWeight: '600',
    marginLeft: wp(8),
  },
  navFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(20),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: hp(10),
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(12),
    borderRadius: ms(10),
    flex: 1,
    maxWidth: wp(140),
  },
  navBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtnPrev: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  navBtnValue: {
    fontSize: fs(13),
    color: '#475569',
    fontWeight: '700',
    marginLeft: wp(8),
  },
  navCenterText: {
    fontSize: fs(10),
    color: '#94A3B8',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navBtnNext: {
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  navBtnDisabledNext: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
  navBtnValueNext: {
    fontSize: fs(13),
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: wp(8),
  },
  videoWrapper: {
    width: '100%',
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: hp(220),
    backgroundColor: '#000',
    borderRadius: ms(12),
  },
  mediaTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#1E293B',
    marginTop: hp(12),
  },
  mediaDescription: {
    fontSize: fs(13),
    color: '#64748B',
    marginTop: hp(4),
    lineHeight: fs(18),
  },
  contentDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: hp(20),
    width: '100%',
  },
});

const htmlStyles = StyleSheet.create({
  paragraph: {
    fontSize: fs(15),
    color: '#1E293B',
    lineHeight: fs(22),
    marginBottom: ms(12),
  },
  heading: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: ms(8),
    marginTop: ms(12),
  },
  listBlock: {
    marginBottom: ms(12),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ms(8),
    paddingRight: wp(10),
  },
  bullet: {
    fontSize: fs(15),
    color: '#3B82F6',
    fontWeight: '700',
    minWidth: wp(24),
    marginTop: ms(1),
  },
  listItemText: {
    flex: 1,
    fontSize: fs(15),
    color: '#1E293B',
    lineHeight: fs(22),
  },
  imageContainer: {
    marginVertical: ms(15),
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(12),
    overflow: 'hidden',
    minHeight: hp(200),
    width: '100%',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: hp(280),
    backgroundColor: '#F1F5F9',
  },
});
