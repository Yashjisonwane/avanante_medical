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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest } from '../../../redux/api/baseApi';

export default function AuditLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { returnTo } = useLocalSearchParams();
  
  const handleGoBack = () => {
    if (returnTo) {
      router.replace(returnTo);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/analytics');
    }
  };
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest({
        endpoint: `/trainee/reports/audit-logs?page=${page}&per_page=10`,
        method: 'GET',
      });
      
      const responseData = response?.data?.data || response?.data || [];
      const total = response?.data?.total || response?.total || 0;
      
      if (page === 1) {
        setLogs(Array.isArray(responseData) ? responseData : []);
      } else {
        setLogs(prev => [...prev, ...(Array.isArray(responseData) ? responseData : [])]);
      }
      
      setPagination({ page, total });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(String(err?.message || 'Failed to fetch audit logs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, []);

  const renderItem = ({ item }) => {
    if (!item) return null;
    
    const event = String(item?.event || item?.action || 'N/A').toUpperCase();
    const description = item?.description || item?.message || 'No description available';
    const ip = item?.ip_address || item?.ip || 'N/A';
    const device = item?.user_agent || item?.device || 'N/A';
    const date = item?.created_at ? new Date(item.created_at).toLocaleString() : 'N/A';
    const userEmail = item?.user?.email || item?.trainee?.email || item?.trainee_email || item?.user_email || 'N/A';
    
    // Status color for event types
    let eventColor = '#3B82F6'; // Default Blue
    if (event.includes('LOGIN')) eventColor = '#10B981';
    if (event.includes('LOGOUT')) eventColor = '#EF4444';
    if (event.includes('VIEWED')) eventColor = '#8B5CF6';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
           <View style={[styles.eventBadge, { backgroundColor: eventColor + '15' }]}>
              <Text style={[styles.eventText, { color: eventColor }]}>{event}</Text>
           </View>
        </View>

        <Text style={styles.descriptionText}>{description}</Text>
        <Text style={styles.dateTextInner}>{date}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('analytics.ip_address', { defaultValue: 'IP ADDRESS' })}</Text>
            <Text style={styles.infoValue}>{ip}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('analytics.device', { defaultValue: 'DEVICE' })}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{device}</Text>
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
          <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleGroup}>
            <Text style={styles.headerTitle}>{t('analytics.audit_logs_title', 'Audit Logs Report')}</Text>
            <Text style={styles.headerSubtitle}>{t('analytics.view_all_audit', 'View all system audit logs')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading && pagination.page === 1 ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: hp(40) }} />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAuditLogs(1)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="list-outline" size={ms(48)} color={AppColors.placeholder} />
            <Text style={styles.emptyText}>No audit logs found</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (logs.length < pagination.total && !loading) {
                fetchAuditLogs(pagination.page + 1);
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
  eventBadge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
  },
  eventText: {
    fontSize: fs(10),
    fontWeight: '800',
  },
  descriptionText: {
    fontSize: fs(14),
    color: AppColors.textDark,
    fontWeight: '700',
    lineHeight: fs(20),
    marginBottom: hp(4),
  },
  dateTextInner: {
    fontSize: fs(11),
    color: AppColors.placeholder,
    marginBottom: hp(12),
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginBottom: hp(12),
  },
  infoRow: {
    flexDirection: 'row',
    gap: wp(20),
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fs(9),
    fontWeight: '700',
    color: AppColors.placeholder,
    marginBottom: hp(2),
  },
  infoValue: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '600',
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
