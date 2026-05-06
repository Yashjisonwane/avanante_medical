import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, fetchUnreadCount } from '../../redux/slices/notificationSlice';
import { wp, hp, ms, fs } from '../../utils/responsive';
import { AppColors } from '../../constants/Theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { list, loading, pagination } = useSelector((state) => state.notifications);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications(1));
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications(1));
    dispatch(fetchUnreadCount());
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && pagination.currentPage < pagination.lastPage) {
      dispatch(fetchNotifications(pagination.currentPage + 1));
    }
  };

  const handleNotificationClick = (item) => {
    const isUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
    if (isUnread) {
      dispatch(markAsRead(item.id));
      // Refetch count to ensure consistency across screens
      setTimeout(() => {
        dispatch(fetchUnreadCount());
      }, 500);
    }
    router.push({
      pathname: `/notifications/${item.id}`,
      params: { 
        title: item.title,
        message: item.message,
        created_at: item.created_at,
        data: JSON.stringify(item.data),
        is_read: item.is_read
      }
    });
  };

  const renderItem = ({ item }) => {
    // Treat as read only if is_read is explicitly true, 1 or "1"
    const isUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationClick(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: isUnread ? '#EFF6FF' : '#F3F4F6' }]}>
          <Ionicons 
            name="notifications" 
            size={ms(20)} 
            color={isUnread ? AppColors.primary : '#94A3B8'} 
          />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={ms(16)} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(10) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(24)} color={AppColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: wp(40) }} />
      </View>

      <FlatList
        data={list}
        extraData={list}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={ms(60)} color="#CBD5E1" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )
        }
        ListFooterComponent={loading && <ActivityIndicator size="small" color={AppColors.primary} style={{ margin: 20 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(15),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: AppColors.textDark,
  },
  listContent: {
    padding: wp(16),
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: wp(12),
    borderRadius: ms(12),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadCard: {
    borderColor: '#DBEAFE',
    backgroundColor: '#F0F7FF',
  },
  iconContainer: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
  },
  unreadTitle: {
    color: '#1E293B',
    fontWeight: '800',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    marginLeft: wp(6),
  },
  message: {
    fontSize: fs(12),
    color: '#94A3B8',
    marginBottom: hp(4),
  },
  time: {
    fontSize: fs(10),
    color: '#CBD5E1',
    fontWeight: '500',
  },
  emptyContainer: {
    marginTop: hp(150),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: hp(10),
    fontSize: fs(16),
    color: '#94A3B8',
    fontWeight: '600',
  },
});
