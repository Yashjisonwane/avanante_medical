import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { fetchSinglePreview, toggleTopicContentRead } from '../../../redux/slices/courseSlice';
import { formatImageUrl } from '../../../utils/imageUtils';

// ─────────────────────────────────────────────────────────────
// Simple HTML → React Native renderer (no external library)
// Handles: <p>, <strong>, <em>, <ol>, <ul>, <li>, <br>, <img>, emojis
// ─────────────────────────────────────────────────────────────
const decodeHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

const parseInlineHtml = (html) => {
  // Returns array of text segments with bold/italic flags
  const segments = [];
  const regex = /<(strong|em|b|i)>(.*?)<\/\1>|([^<]+)/gs;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      // bold or italic tag
      const tag = match[1];
      segments.push({
        text: decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '')),
        bold: tag === 'strong' || tag === 'b',
        italic: tag === 'em' || tag === 'i',
      });
    } else if (match[3]) {
      const text = decodeHtmlEntities(match[3]);
      if (text.trim()) segments.push({ text, bold: false, italic: false });
    }
  }
  return segments;
};

const InlineText = ({ html, style }) => {
  const segments = parseInlineHtml(html || '');
  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={[
            seg.bold && { fontWeight: '700' },
            seg.italic && { fontStyle: 'italic' },
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
};

const HtmlRenderer = ({ html }) => {
  if (!html) return null;

  // Split by block-level tags
  const blocks = [];
  const blockRegex = /<(p|ol|ul|h[1-6]|br|a)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*\/?>|<br\s*\/?>/gi;
  let lastIndex = 0;
  let match;

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || 
           (url.includes('cdn') && (url.includes('image') || url.includes('img')));
  };

  while ((match = blockRegex.exec(html)) !== null) {
    // Text before this block
    const before = html.slice(lastIndex, match.index).trim();
    if (before && before !== '') {
      const clean = before.replace(/<[^>]+>/g, '').trim();
      if (clean) {
        if (isImageUrl(clean)) {
          blocks.push({ type: 'image', src: clean });
        } else {
          blocks.push({ type: 'text', content: clean });
        }
      }
    }

    const tag = match[1]?.toLowerCase();
    const fullTag = match[0];
    const inner = match[2] || '';

    if (tag === 'p') {
      // Split paragraph by img tags to render them as blocks
      const parts = inner.split(/(<img\b[^>]*\/?>)/gi);
      parts.forEach(part => {
        if (part.toLowerCase().startsWith('<img')) {
          const srcMatch = /src=["']([^"']+)["']/i.exec(part);
          if (srcMatch) blocks.push({ type: 'image', src: srcMatch[1] });
        } else {
          const cleanText = part.replace(/<[^>]+>/g, '').trim();
          if (cleanText) {
            if (isImageUrl(cleanText)) {
              blocks.push({ type: 'image', src: cleanText });
            } else {
              blocks.push({ type: 'paragraph', content: part });
            }
          }
        }
      });
    } else if (tag === 'ol' || tag === 'ul') {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      const items = [];
      while ((liMatch = liRegex.exec(inner)) !== null) {
        items.push({ listType: tag === 'ol' ? 'ordered' : 'bullet', content: liMatch[1] });
      }
      if (items.length > 0) blocks.push({ type: 'list', items });
    } else if (tag && tag.startsWith('h')) {
      blocks.push({ type: 'heading', content: inner, level: parseInt(tag[1]) });
    } else if (tag === 'a') {
      const hrefMatch = /href=["']([^"']+)["']/i.exec(fullTag);
      const href = hrefMatch ? hrefMatch[1] : '';
      if (isImageUrl(href) || isImageUrl(inner.replace(/<[^>]+>/g, '').trim())) {
        blocks.push({ type: 'image', src: href || inner.replace(/<[^>]+>/g, '').trim() });
      } else {
        blocks.push({ type: 'text', content: inner + (href ? ` (${href})` : '') });
      }
    } else if (fullTag.toLowerCase().startsWith('<img')) {
      const srcMatch = /src=["']([^"']+)["']/i.exec(fullTag);
      if (srcMatch) {
        blocks.push({ type: 'image', src: srcMatch[1] });
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing text
  const trailing = html.slice(lastIndex).replace(/<[^>]+>/g, '').trim();
  if (trailing) {
    if (isImageUrl(trailing)) {
      blocks.push({ type: 'image', src: trailing });
    } else {
      blocks.push({ type: 'text', content: trailing });
    }
  }

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <InlineText
              key={i}
              html={block.content}
              style={htmlStyles.paragraph}
            />
          );
        }
        if (block.type === 'heading') {
          return (
            <InlineText
              key={i}
              html={block.content}
              style={[htmlStyles.paragraph, htmlStyles.heading]}
            />
          );
        }
        if (block.type === 'text') {
          return (
            <Text key={i} style={htmlStyles.paragraph}>
              {decodeHtmlEntities(block.content)}
            </Text>
          );
        }
        if (block.type === 'image') {
          return (
            <View key={i} style={htmlStyles.imageContainer}>
              <Image
                source={formatImageUrl(block.src)}
                style={htmlStyles.image}
                resizeMode="contain"
              />
            </View>
          );
        }
        if (block.type === 'list') {
          let counter = 0;
          return (
            <View key={i} style={htmlStyles.listBlock}>
              {block.items.map((item, j) => {
                const isOrdered = item.listType === 'ordered';
                if (isOrdered) counter++;
                const bullet = isOrdered ? `${counter}.` : '•';
                const cleanContent = item.content
                  .replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '')
                  .trim();
                return (
                  <View key={j} style={htmlStyles.listItem}>
                    <Text style={htmlStyles.bullet}>{bullet}</Text>
                    <InlineText
                      html={cleanContent}
                      style={htmlStyles.listItemText}
                    />
                  </View>
                );
              })}
            </View>
          );
        }
        return null;
      })}
    </View>
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
  const [markingRead, setMarkingRead] = useState(false);

  const { singlePreview, loading } = useSelector((state) => state.course);

  useEffect(() => {
    if (topicId && contentId) {
      dispatch(fetchSinglePreview({ topicId, contentId }));
    }
  }, [dispatch, topicId, contentId]);

  if (loading.singlePreview) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const topicData   = singlePreview?.topic     || {};
  const contentData = singlePreview?.current   || {};
  const navigation  = singlePreview?.navigation || {};

  const isMedia = contentData.type === 'media' || contentData.type === 'video';
  const isRead  =
    contentData.is_read == 1 ||
    contentData.is_read == true ||
    contentData.is_read == 'true';

  const prevId = navigation.previous_content_id || null;
  const nextId = navigation.next_content_id     || null;

  const handleMarkRead = async () => {
    if (isRead || markingRead) return;
    setMarkingRead(true);
    try {
      await dispatch(toggleTopicContentRead(Number(contentId))).unwrap();
      dispatch(fetchSinglePreview({ topicId, contentId }));
    } catch (e) {
      // ignore
    } finally {
      setMarkingRead(false);
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

        <Text style={styles.title}>{contentData.title || 'Untitled'}</Text>
        <Text style={styles.subtitle}>{topicData.description || topicData.title || ''}</Text>

        <View style={styles.contentBox}>
          {isMedia ? (
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="videocam-outline" size={ms(48)} color="#94A3B8" />
              <Text style={styles.mediaPlaceholderText}>
                Media content will be played here.
              </Text>
            </View>
          ) : contentData.content ? (
            <HtmlRenderer html={contentData.content} />
          ) : (
            <Text style={styles.emptyContent}>No content available.</Text>
          )}
        </View>

        {isRead ? (
          <View style={styles.alreadyReadBox}>
            <Ionicons name="checkmark-circle" size={ms(20)} color="#10B981" />
            <Text style={styles.alreadyReadText}>You have read this topic</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkRead}
            disabled={markingRead}
          >
            {markingRead ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={ms(18)} color="#fff" />
                <Text style={styles.markReadBtnText}>Mark as Read</Text>
              </>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: wp(18),
    paddingTop: hp(15),
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
    padding: ms(16),
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
  alreadyReadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: ms(12),
    paddingVertical: hp(14),
    marginBottom: hp(25),
  },
  alreadyReadText: {
    fontSize: fs(14),
    color: '#10B981',
    fontWeight: '700',
    marginLeft: wp(8),
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: ms(12),
    paddingVertical: hp(14),
    marginBottom: hp(25),
    minHeight: hp(52),
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  markReadBtnText: {
    fontSize: fs(15),
    color: '#FFFFFF',
    fontWeight: '700',
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
