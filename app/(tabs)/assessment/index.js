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
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { hp, wp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest } from '../../../redux/api/baseApi';

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'certificate'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async (type) => {
    setLoading(true);
    setError(null);
    try {
      // type can be 'topic' for Analytics (Quiz) or 'level' for Certificate (Exam)
      const response = await apiRequest({
        endpoint: `/trainee/reports/assessment-report?page=1&per_page=100&type=${type}&lang=${i18n.language}`,
        method: 'GET',
      });
      
      // Data extraction logic:
      // The API structure is usually response.data.data or response.data
      const responseData = response?.data?.data || response?.data || response || [];
      setData(Array.isArray(responseData) ? responseData : (responseData?.data && Array.isArray(responseData.data) ? responseData.data : []));
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(String(err?.message || 'Failed to fetch assessments'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchReports(activeTab === 'analytics' ? 'topic' : 'level');
    }, [activeTab, i18n.language])
  );

  const renderItem = ({ item }) => {
    if (!item) return null;
    
    // Data Extraction
    // Data Extraction
    const assessment = item?.assessment || {};
    const title = String(assessment?.title || item?.title || 'Assessment');
    
    // DEBUG: Log the item to see the API structure
    // console.log('Assessment Item:', JSON.stringify(item));

    // Correctly extract counts based on the API response structure
    // We prioritize "count" fields and avoid "marks" or "score" for these specific labels
    const correct = Number(
      item?.correct_answers_count ?? 
      item?.correct_answer_count ??
      item?.correct_answers ?? 
      item?.correct_answer ??
      item?.correct_count ?? 
      item?.correct ?? 
      item?.meta?.questions?.correct_answers ??
      item?.meta?.questions?.correct ??
      assessment?.correct_answers_count ??
      assessment?.correct_answers ??
      0
    );
    
    const total = Number(
      item?.total_questions_count ?? 
      item?.total_questions ?? 
      item?.questions_count ??
      item?.total_count ?? 
      item?.total_question ??
      item?.total ?? 
      assessment?.total_questions_count ??
      assessment?.total_questions ?? 
      assessment?.questions_count ??
      5
    );
    
    const scorePoints = Number(item?.marks_obtained ?? item?.score ?? item?.obtained_marks ?? 0);
    const totalPoints = Number(assessment?.total_marks ?? item?.total_marks ?? 100);
    
    const percentage = totalPoints > 0 ? ((scorePoints / totalPoints) * 100).toFixed(2) : '0.00';
    
    const status = String(item?.status || 'FAILED').toUpperCase();
    const isPassed = status === 'PASSED' || status === 'COMPLETED';
    const isInProgress = status === 'IN_PROGRESS';
    
    const incorrect = item?.wrong_answers_count ?? item?.wrong_answers ?? item?.wrong_count ?? item?.wrong_answer ?? item?.wrong ?? item?.incorrect ?? item?.meta?.questions?.wrong_answers ?? item?.meta?.questions?.wrong ?? assessment?.wrong_answers_count ?? 0;
    const skipped = item?.skipped_questions_count ?? item?.skipped_questions ?? item?.skipped_count ?? item?.skipped_question ?? item?.skipped ?? item?.meta?.questions?.skipped_questions ?? item?.meta?.questions?.skipped ?? assessment?.skipped_questions_count ?? 0;
    
    const attempt = item?.attempt_number || 1;
    
    // Robust Date Extraction
    const rawDate = 
      item?.created_at || 
      item?.updated_at || 
      item?.completed_at || 
      item?.date || 
      item?.last_activity_date ||
      item?.meta?.time?.submitted_at ||
      item?.meta?.submitted_at ||
      item?.meta?.date ||
      item?.meta?.created_at ||
      item?.meta?.time?.created_at ||
      item?.assessment?.created_at ||
      item?.assessment?.updated_at;

    const getFormattedDate = (val) => {
      if (!val) return 'N/A';
      try {
        let d = new Date(val);
        // Handle Unix Timestamps (seconds)
        if (typeof val === 'number' && val < 2000000000) {
          d = new Date(val * 1000);
        }
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'N/A';
      }
    };

    const date = getFormattedDate(rawDate);
    
    const trainee = item?.trainee || {};
    const userName = trainee?.name || 'User';
    const userEmail = trainee?.email || '';

    return (
      <View style={styles.card}>
        {/* Row 1: User & Assessment Info */}
        <View style={styles.cardSection}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            {userEmail ? <Text style={styles.userEmail}>{userEmail}</Text> : null}
          </View>
          <View style={styles.assessmentInfo}>
            <Text style={styles.infoLabel}>{t('assessment.type', { defaultValue: 'Assessment' })}</Text>
            <Text style={styles.infoValue}>{title}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 2: Score & Status */}
        <View style={styles.cardSection}>
          <View style={styles.statsBox}>
            <Text style={styles.infoLabel}>{t('assessment.score_percent', { defaultValue: 'Score / Percentage' })}</Text>
            <Text style={styles.scoreValue}>{correct} / {total}</Text>
            <Text style={styles.percentValue}>{percentage}%</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.infoLabel}>{t('assessment.status', { defaultValue: 'Status' })}</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isPassed ? '#E8F5E9' : isInProgress ? '#FFF3E0' : '#FFEBEE' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: isPassed ? '#2E7D32' : isInProgress ? '#EF6C00' : '#C62828' }
              ]}>
                {status}
              </Text>
            </View>
            <Text style={styles.passingText}>{t('assessment.passing', { defaultValue: 'Passing: 60%' })}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 3: Answers & Attempt */}
        <View style={styles.cardSection}>
          <View style={styles.answersBox}>
            <Text style={styles.infoLabel}>{t('assessment.answers', { defaultValue: 'Answers' })}</Text>
            <View style={styles.answerRow}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.answerText}> {t('assessment.correct', { defaultValue: 'Correct' })}: {correct}</Text>
            </View>
            <View style={styles.answerRow}>
              <Ionicons name="close-circle" size={14} color="#F44336" />
              <Text style={styles.answerText}> {t('assessment.incorrect', { defaultValue: 'Incorrect' })}: {incorrect}</Text>
            </View>
            <View style={styles.answerRow}>
              <Ionicons name="help-circle" size={14} color="#757575" />
              <Text style={styles.answerText}> {t('assessment.skipped', { defaultValue: 'Skipped' })}: {skipped}</Text>
            </View>
          </View>
          <View style={styles.attemptBox}>
            <Text style={styles.infoLabel}>{t('assessment.attempt', { defaultValue: 'Attempt' })}</Text>
            <Text style={styles.attemptValue}>Attempt #{attempt}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 4: Date & Action */}
        <View style={styles.cardFooter}>
          <View style={styles.dateBox}>
            <Ionicons name="time-outline" size={14} color={AppColors.textSecondary} />
            <Text style={styles.dateText}> {date}</Text>
          </View>
          {isPassed && (
            <TouchableOpacity 
              style={styles.certificateBtn}
              onPress={() => router.push({
                pathname: '/(tabs)/analytics/certificate',
                params: { 
                  assessmentId: item?.passed_attempt_id || item?.id,
                  returnTo: '/(tabs)/assessment'
                }
              })}
            >
              <Text style={styles.certificateBtnText}>{t('analytics.view_certificate', { defaultValue: 'View Certificate' })}</Text>
            </TouchableOpacity>
          )}
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
          style={[styles.tabButton, activeTab === 'analytics' && styles.activeTabButton]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            {t('home.analytics', { defaultValue: 'Analytics' })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'certificate' && styles.activeTabButton]}
          onPress={() => setActiveTab('certificate')}
        >
          <Text style={[styles.tabText, activeTab === 'certificate' && styles.activeTabText]}>
            {t('analytics.certificates', { defaultValue: 'Certificate' })}
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
    marginBottom: hp(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(8),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fs(15),
    fontWeight: '700',
    color: AppColors.textDark,
  },
  userEmail: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    marginTop: hp(2),
  },
  assessmentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: fs(11),
    fontWeight: '600',
    color: AppColors.placeholder,
    textTransform: 'uppercase',
    marginBottom: hp(4),
  },
  infoValue: {
    fontSize: fs(14),
    fontWeight: '700',
    color: AppColors.primary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: hp(4),
  },
  statsBox: {
    flex: 1,
  },
  scoreValue: {
    fontSize: fs(15),
    fontWeight: '700',
    color: AppColors.textDark,
  },
  percentValue: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    marginTop: hp(2),
  },
  statusBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
    marginBottom: hp(4),
  },
  statusText: {
    fontSize: fs(11),
    fontWeight: '800',
  },
  passingText: {
    fontSize: fs(11),
    color: AppColors.placeholder,
  },
  answersBox: {
    flex: 1.5,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  answerText: {
    fontSize: fs(12),
    color: AppColors.textDark,
    fontWeight: '500',
  },
  attemptBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  attemptValue: {
    fontSize: fs(14),
    fontWeight: '600',
    color: AppColors.textDark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(10),
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
  },
  certificateBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  certificateBtnText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: AppColors.primary,
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
