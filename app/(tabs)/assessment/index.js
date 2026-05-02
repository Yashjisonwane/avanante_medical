import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { hp, wp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest } from '../../../redux/api/baseApi';

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'exam'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async (type) => {
    setLoading(true);
    setError(null);
    try {
      // type can be 'topic' for Quiz or 'level' for Exam
      const response = await apiRequest({
        endpoint: `/trainee/reports/assessment-report?page=1&per_page=10&type=${type}`,
        method: 'GET',
      });
      
      const responseData = response?.data?.data || response?.data || [];
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(String(err?.message || 'Failed to fetch assessments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(activeTab === 'quiz' ? 'topic' : 'level');
  }, [activeTab]);

  const renderItem = ({ item }) => {
    if (!item) return null;
    const title = String(item?.assessment?.title || item?.title || 'Assessment');
    const score = Number(item?.score ?? item?.marks_obtained ?? 0);
    const total = Number(item?.total_marks ?? item?.assessment?.total_marks ?? 100);
    const statusString = String(item?.status || (score >= (total / 2) ? 'Passed' : 'Failed'));
    const isPassed = statusString.toLowerCase() === 'passed' || statusString.toLowerCase() === 'completed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="clipboard" size={ms(24)} color={AppColors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>
              {t('assessment.score', { defaultValue: 'Score' })}: {score}/{total}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isPassed ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: isPassed ? '#4CAF50' : '#F44336' }]}>
              {statusString}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <View style={styles.greenAccentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {t('tabs.assessment', { defaultValue: 'Assessment' })}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'quiz' && styles.activeTabButton]}
          onPress={() => setActiveTab('quiz')}
        >
          <Text style={[styles.tabText, activeTab === 'quiz' && styles.activeTabText]}>
            {t('assessment.quiz', { defaultValue: 'Quiz' })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'exam' && styles.activeTabButton]}
          onPress={() => setActiveTab('exam')}
        >
          <Text style={[styles.tabText, activeTab === 'exam' && styles.activeTabText]}>
            {t('assessment.exam', { defaultValue: 'Exam' })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: hp(40) }} />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchReports(activeTab === 'quiz' ? 'topic' : 'level')}>
              <Text style={styles.retryText}>{t('common.retry', { defaultValue: 'Retry' })}</Text>
            </TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="document-text-outline" size={ms(48)} color={AppColors.placeholder} />
            <Text style={styles.emptyText}>
              {t('assessment.empty', { defaultValue: 'No assessments found' })}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
    justifyContent: 'center',
    paddingHorizontal: wp(16),
    marginTop: hp(10),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: AppColors.textWhite,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(20),
    marginTop: hp(20),
    backgroundColor: '#E8EDF5',
    borderRadius: ms(12),
    padding: wp(4),
  },
  tabButton: {
    flex: 1,
    paddingVertical: hp(12),
    alignItems: 'center',
    borderRadius: ms(8),
  },
  activeTabButton: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: wp(20),
    paddingBottom: hp(100),
  },
  card: {
    backgroundColor: AppColors.backgroundWhite,
    borderRadius: ms(16),
    padding: wp(16),
    marginBottom: hp(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: wp(48),
    height: wp(48),
    borderRadius: ms(10),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: hp(4),
  },
  cardSubtitle: {
    fontSize: fs(12),
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
  },
  statusText: {
    fontSize: fs(10),
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
