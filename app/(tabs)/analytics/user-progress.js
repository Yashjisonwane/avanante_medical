import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest } from '../../../redux/api/baseApi';

export default function UserProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });

  const fetchUserProgress = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest({
        endpoint: `/trainee/reports/user-progress?page=${page}&per_page=10`,
        method: 'GET',
      });
      
      const responseData = response?.data?.data || response?.data || [];
      const total = response?.data?.total || response?.total || 0;
      
      if (page === 1) {
        setData(Array.isArray(responseData) ? responseData : []);
      } else {
        setData(prev => [...prev, ...(Array.isArray(responseData) ? responseData : [])]);
      }
      
      setPagination({ page, total });
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setError(String(err?.message || 'Failed to fetch user progress'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProgress(1);
  }, []);

  const renderItem = ({ item }) => {
    if (!item) return null;
    
    const traineeEmail = item?.email || item?.trainee_email || item?.user_email || 'N/A';
    
    const level = item?.level || item?.level_title || 'N/A';
    const module = item?.module || item?.module_title || 'N/A';
    const chapter = item?.chapter || item?.chapter_title || 'N/A';
    const topic = item?.topic || item?.topic_title || 'N/A';
    
    const progress = Number(item?.completion_percentage ?? item?.progress ?? item?.completion_percent ?? 0);
    const status = item?.completion_status || item?.status || (progress === 100 ? 'Completed' : 'In Progress');
    const isCompleted = status.toLowerCase() === 'completed' || item?.is_completed == true;
    const date = (item?.last_activity_date || item?.updated_at || item?.created_at) ? new Date(item.last_activity_date || item.updated_at || item.created_at).toLocaleDateString() : 'N/A';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
           <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#E8F5E9' : '#FFF3E0' }]}>
              <Text style={[styles.statusText, { color: isCompleted ? '#2E7D32' : '#EF6C00' }]}>{status}</Text>
           </View>
        </View>

        <View style={styles.hierarchySection}>
           <Text style={styles.hierarchyLabel}>{t('analytics.level_upper', 'LEVEL')}</Text>
           <Text style={styles.hierarchyValue}>{level}</Text>
           
           <View style={styles.hierarchyRow}>
              <View style={styles.hierarchyItem}>
                <Text style={styles.hierarchyLabel}>{t('analytics.module_upper', 'MODULE')}</Text>
                <Text style={styles.hierarchyValue} numberOfLines={1}>{module}</Text>
              </View>
              <View style={styles.hierarchyItem}>
                <Text style={styles.hierarchyLabel}>{t('analytics.chapter_upper', 'CHAPTER')}</Text>
                <Text style={styles.hierarchyValue} numberOfLines={1}>{chapter}</Text>
              </View>
           </View>

           <Text style={styles.hierarchyLabel}>{t('analytics.topic_upper', 'TOPIC')}</Text>
           <Text style={styles.hierarchyValue}>{topic}</Text>
        </View>

        <View style={styles.progressSection}>
           <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>{t('analytics.completion', 'Completion')}</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
           </View>
           <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
           </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateBox}>
            <Ionicons name="time-outline" size={14} color={AppColors.placeholder} />
            <Text style={styles.dateText}> {t('analytics.last_activity', 'Last Activity')}: {date}</Text>
          </View>
          <View style={styles.lockStatus}>
            <Ionicons name="lock-open-outline" size={14} color="#4CAF50" />
            <Text style={styles.lockText}> {t('analytics.unlocked', 'Unlocked')}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <View style={styles.greenAccentBar} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleGroup}>
            <Text style={styles.headerTitle}>{t('analytics.user_progress_title', 'User Progress Report')}</Text>
            <Text style={styles.headerSubtitle}>{t('analytics.view_all_progress', 'View all user progress data')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading && pagination.page === 1 ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: hp(40) }} />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchUserProgress(1)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="bar-chart-outline" size={ms(48)} color={AppColors.placeholder} />
            <Text style={styles.emptyText}>No progress data found</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (data.length < pagination.total && !loading) {
                fetchUserProgress(pagination.page + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loading ? <ActivityIndicator size="small" color={AppColors.primary} /> : null}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  greenAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(4),
    backgroundColor: AppColors.teal,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingBottom: hp(20),
    borderBottomLeftRadius: ms(20),
    borderBottomRightRadius: ms(20),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    marginTop: hp(10),
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  titleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: AppColors.textWhite,
  },
  headerSubtitle: {
    fontSize: fs(12),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: wp(16),
    paddingBottom: hp(40),
  },
  card: {
    backgroundColor: AppColors.backgroundWhite,
    borderRadius: ms(16),
    padding: wp(16),
    marginBottom: hp(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  userEmailText: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
  },
  statusText: {
    fontSize: fs(10),
    fontWeight: '800',
  },
  hierarchySection: {
    marginBottom: hp(16),
  },
  hierarchyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(8),
    gap: wp(10),
  },
  hierarchyItem: {
    flex: 1,
  },
  hierarchyLabel: {
    fontSize: fs(9),
    fontWeight: '700',
    color: AppColors.placeholder,
    marginBottom: hp(2),
  },
  hierarchyValue: {
    fontSize: fs(13),
    fontWeight: '700',
    color: AppColors.textDark,
  },
  progressSection: {
    marginBottom: hp(16),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(6),
  },
  progressLabel: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: fs(12),
    fontWeight: '700',
    color: AppColors.primary,
  },
  progressBarBg: {
    height: hp(8),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(4),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: ms(4),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(12),
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: fs(11),
    color: AppColors.placeholder,
    fontWeight: '500',
  },
  lockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  lockText: {
    fontSize: fs(11),
    color: '#4CAF50',
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: hp(10),
    fontSize: fs(14),
    color: AppColors.placeholder,
  },
  errorText: {
    color: 'red',
    fontSize: fs(14),
    marginBottom: hp(10),
  },
  retryBtn: {
    paddingHorizontal: wp(20),
    paddingVertical: hp(8),
    backgroundColor: AppColors.primary,
    borderRadius: ms(8),
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
