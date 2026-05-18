import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, fetchUnreadCount, markReadLocal } from '../../redux/slices/notificationSlice';
import { wp, hp, ms, fs } from '../../utils/responsive';
import { AppColors } from '../../constants/Theme';

// Custom Relative Time Ago Generator
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  
  if (isNaN(date.getTime())) return '';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Map notification types to specific icons and colors
const getNotificationTypeConfig = (type, isRead) => {
  const iconColor = isRead ? '#94A3B8' : '#2563EB';
  const iconBg = isRead ? '#F1F5F9' : '#EFF6FF';
  
  switch (type) {
    case 'LESSON_UNLOCKED':
    case 'TOPIC_UNLOCKED':
      return {
        icon: 'book',
        color: '#2563EB',
        bg: '#EFF6FF',
      };
    case 'CERTIFICATE_GENERATED':
    case 'CERTIFICATE_READY':
      return {
        icon: 'ribbon',
        color: '#8B5CF6',
        bg: '#F5F3FF',
      };
    case 'ASSESSMENT_COMPLETED':
    case 'ASSESSMENT_PASSED':
      return {
        icon: 'checkmark-circle',
        color: '#10B981',
        bg: '#ECFDF5',
      };
    case 'LESSON_COMPLETED':
    case 'TOPIC_COMPLETED':
      return {
        icon: 'school',
        color: '#F59E0B',
        bg: '#FEF3C7',
      };
    case 'ASSESSMENT_STARTED':
      return {
        icon: 'play-circle',
        color: '#EC4899',
        bg: '#FDF2F8',
      };
    case 'TRAINING_ASSIGNED':
      return {
        icon: 'map',
        color: '#06B6D4',
        bg: '#ECFEFF',
      };
    default:
      return {
        icon: 'notifications',
        color: iconColor,
        bg: iconBg,
      };
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  
  const { list, loading, analytics, pagination } = useSelector((state) => state.notifications);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'

  // Load notifications and count on focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications(1));
      dispatch(fetchUnreadCount());
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications(1));
    await dispatch(fetchUnreadCount());
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && pagination.currentPage < pagination.lastPage) {
      dispatch(fetchNotifications(pagination.currentPage + 1));
    }
  };

  const handleNotificationClick = async (item) => {
    const isUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
    if (isUnread) {
      dispatch(markReadLocal(item.id));
      dispatch(markAsRead(item.id));
    }
    router.push({
      pathname: `/notifications/${item.id}`,
      params: { 
        title: item.title,
        message: item.message,
        created_at: item.created_at,
        data: JSON.stringify(item.data),
        is_read: '1'
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = list.filter(item => !(item.is_read === true || item.is_read == 1 || item.is_read === '1'));
    if (unreadItems.length === 0) return;
    
    // Mark locally immediately for visual speed
    unreadItems.forEach(item => {
      dispatch(markReadLocal(item.id));
    });
    
    // Background API updates
    try {
      await Promise.all(unreadItems.map(item => dispatch(markAsRead(item.id)).unwrap()));
    } catch (e) {
      console.log("Error marking some notifications as read:", e);
    }
    
    // Refresh to get perfectly in-sync analytics, badge counts, and pagination from server!
    dispatch(fetchNotifications(1));
    dispatch(fetchUnreadCount());
  };

  // Filter list locally based on selected tab
  const filteredList = list.filter(item => {
    if (activeTab === 'unread') {
      return !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
    }
    return true;
  });

  const renderNotificationCard = ({ item }) => {
    const isUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
    const config = getNotificationTypeConfig(item.type, !isUnread);

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationClick(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIconBox, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={ms(20)} color={config.color} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              {isUnread && <View style={styles.cardUnreadBlueDot} />}
            </View>

            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={ms(12)} color="#94A3B8" style={{ marginRight: wp(4) }} />
              <Text style={styles.cardTimeText}>{timeAgo(item.created_at)}</Text>
            </View>
          </View>

          <Text style={styles.cardMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const isLargeScreen = width > 768;

  return (
    <View style={styles.container}>
      {/* Top Breadcrumb Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + hp(10) }]}>
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.breadcrumbText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSeparator}> / </Text>
          <Text style={styles.breadcrumbTextActive}>Notifications</Text>
        </View>

        <View style={styles.titleAreaRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>Notifications</Text>
            <Text style={styles.subTitle} numberOfLines={1}>Stay updated with your learning journey and achievements</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={ms(22)} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(80) }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
        }
      >
        {/* Metric KPI Cards Row */}
        <View style={[styles.metricsRow, isLargeScreen ? styles.metricsRowGrid : styles.metricsRowStack]}>
          {/* Card 1: Total */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardLeft}>
              <Text style={styles.metricTitle}>TOTAL NOTIFICATIONS</Text>
              <Text style={styles.metricValue}>{analytics?.total || 0}</Text>
            </View>
            <View style={[styles.metricIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="notifications" size={ms(20)} color="#2563EB" />
            </View>
          </View>

          {/* Card 2: Unread */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardLeft}>
              <Text style={styles.metricTitle}>UNREAD</Text>
              <Text style={[styles.metricValue, { color: '#2563EB' }]}>{analytics?.unread || 0}</Text>
            </View>
            <View style={[styles.metricIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="notifications-circle" size={ms(22)} color="#2563EB" />
            </View>
          </View>

          {/* Card 3: Read */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardLeft}>
              <Text style={styles.metricTitle}>READ</Text>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>{analytics?.read || 0}</Text>
            </View>
            <View style={[styles.metricIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-done" size={ms(22)} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Tab Selection and Mark all as Read Bar */}
        <View style={styles.tabsControlBar}>
          <View style={styles.tabButtonsGroup}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
              onPress={() => setActiveTab('all')}
            >
              <Ionicons 
                name="mail-open-outline" 
                size={ms(14)} 
                color={activeTab === 'all' ? '#2563EB' : '#64748B'} 
                style={{ marginRight: wp(6) }}
              />
              <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
                All Notifications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'unread' && styles.tabBtnActive]}
              onPress={() => setActiveTab('unread')}
            >
              <Ionicons 
                name="notifications-outline" 
                size={ms(14)} 
                color={activeTab === 'unread' ? '#2563EB' : '#64748B'} 
                style={{ marginRight: wp(6) }}
              />
              <Text style={[styles.tabBtnText, activeTab === 'unread' && styles.tabBtnTextActive]}>
                Unread
              </Text>
              {analytics?.unread > 0 && (
                <View style={styles.tabBadgeRed}>
                  <Text style={styles.tabBadgeText}>{analytics.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.markAllReadBtn} onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done" size={ms(14)} color="#2563EB" style={{ marginRight: wp(4) }} />
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* List of Notifications */}
        <FlatList
          data={filteredList}
          extraData={filteredList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationCard}
          scrollEnabled={false} // Managed by outer ScrollView
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyCardContainer}>
                <Ionicons name="notifications-off-outline" size={ms(48)} color="#CBD5E1" />
                <Text style={styles.emptyCardText}>No notifications in this tab</Text>
              </View>
            )
          }
        />

        {loading && (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: hp(20) }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(20),
    paddingBottom: hp(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  breadcrumbText: {
    fontSize: fs(12),
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: fs(12),
    color: '#94A3B8',
  },
  breadcrumbTextActive: {
    fontSize: fs(12),
    color: '#0F172A',
    fontWeight: '600',
  },
  titleAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(4),
  },
  subTitle: {
    fontSize: fs(13),
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
  },

  // Metrics Row
  metricsRow: {
    gap: wp(16),
    marginBottom: hp(20),
  },
  metricsRowGrid: {
    flexDirection: 'row',
  },
  metricsRowStack: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  metricCardLeft: {
    flex: 1,
  },
  metricTitle: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: hp(6),
  },
  metricValue: {
    fontSize: fs(24),
    fontWeight: '800',
    color: '#0F172A',
  },
  metricIconBadge: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs bar
  tabsControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: hp(10),
    marginBottom: hp(16),
  },
  tabButtonsGroup: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: wp(4),
    borderRadius: ms(10),
    gap: wp(4),
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
    borderRadius: ms(8),
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: fs(13),
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#2563EB',
  },
  tabBadgeRed: {
    backgroundColor: '#EF4444',
    borderRadius: ms(8),
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    marginLeft: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#fff',
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(6),
  },
  markAllReadText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#2563EB',
  },

  // Notification Cards
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: wp(16),
    borderRadius: ms(12),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadCard: {
    borderColor: '#DBEAFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardIconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(14),
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(6),
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: wp(10),
  },
  cardTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#475569',
  },
  cardTitleUnread: {
    color: '#0F172A',
    fontWeight: '800',
  },
  cardUnreadBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginLeft: wp(6),
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTimeText: {
    fontSize: fs(11),
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardMessage: {
    fontSize: fs(12),
    color: '#64748B',
    lineHeight: hp(18),
  },
  emptyCardContainer: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: hp(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardText: {
    fontSize: fs(14),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: hp(12),
  },
});
