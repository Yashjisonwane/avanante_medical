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

export default function CertificationReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });

  const fetchCertifications = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest({
        endpoint: `/trainee/reports/certifications?page=${page}&per_page=10`,
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
      console.error('Error fetching certifications:', err);
      setError(String(err?.message || 'Failed to fetch certifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications(1);
  }, []);

  const renderItem = ({ item }) => {
    if (!item) return null;
    
    const trainee = item?.trainee || {};
    const traineeEmail = trainee?.email || item?.trainee_email || item?.user_email || 'N/A';
    
    const program = item?.program?.title || item?.course?.title || item?.title || item?.program_title || item?.course_name || 'N/A';
    const type = String(item?.type || item?.assessment_type || 'TOPIC').toUpperCase();
    const certId = item?.certificate_id || item?.cert_id || 'N/A';
    const score = item?.score || item?.obtained_marks || '0';
    const total = item?.total_marks || item?.max_marks || '100';
    const percentage = item?.percentage || item?.percent || '0';
    const issueDate = item?.issue_date || item?.created_at;
    const formattedDate = issueDate ? new Date(issueDate).toLocaleDateString() : 'N/A';
    const status = item?.status || 'Active';
    const isAvailable = item?.is_available ?? true;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
           <View style={styles.userSection}>
              <Ionicons name="mail-outline" size={14} color={AppColors.placeholder} />
              <Text style={styles.userEmailText}>{traineeEmail}</Text>
           </View>
           <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.statusText, { color: '#2E7D32' }]}>{status}</Text>
           </View>
        </View>

        <View style={styles.programSection}>
           <View style={styles.programHeader}>
              <Text style={styles.programTitle}>{program}</Text>
              <View style={styles.typeBadge}>
                 <Text style={styles.typeText}>{type}</Text>
              </View>
           </View>
           <Text style={styles.certIdText}>ID: {certId}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>{score}/{total}</Text>
           </View>
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>PERCENTAGE</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>{percentage}%</Text>
           </View>
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>ISSUE DATE</Text>
              <View style={styles.dateRow}>
                 <Ionicons name="calendar-outline" size={12} color={AppColors.placeholder} />
                 <Text style={styles.dateText}> {formattedDate}</Text>
              </View>
           </View>
        </View>

        <View style={styles.cardFooter}>
          {isAvailable ? (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push({
                pathname: '/analytics/certificate',
                params: { assessmentId: item?.id }
              })}
            >
              <Ionicons name="eye-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>View Certificate</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.unavailableBox}>
              <Text style={styles.unavailableText}>Certificate Not Available</Text>
            </View>
          )}
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
            <Text style={styles.headerTitle}>Certification Report</Text>
            <Text style={styles.headerSubtitle}>View all user certifications</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading && pagination.page === 1 ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: hp(40) }} />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchCertifications(1)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="ribbon-outline" size={ms(48)} color={AppColors.placeholder} />
            <Text style={styles.emptyText}>No certifications found</Text>
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
                fetchCertifications(pagination.page + 1);
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
  programSection: {
    marginBottom: hp(12),
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  programTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: AppColors.textDark,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: ms(4),
  },
  typeText: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#7B1FA2',
  },
  certIdText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: AppColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: hp(12),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(16),
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: fs(9),
    fontWeight: '700',
    color: AppColors.placeholder,
    marginBottom: hp(4),
  },
  statValue: {
    fontSize: fs(13),
    fontWeight: '700',
    color: AppColors.textDark,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    paddingTop: hp(4),
  },
  actionBtn: {
    backgroundColor: AppColors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    borderRadius: ms(10),
    gap: wp(6),
  },
  actionBtnText: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#fff',
  },
  unavailableBox: {
    backgroundColor: '#F3F4F6',
    paddingVertical: hp(10),
    borderRadius: ms(10),
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: fs(13),
    color: AppColors.placeholder,
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
