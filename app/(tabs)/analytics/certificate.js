import React, { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest } from '../../../redux/api/baseApi';

export default function CertificateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { assessmentId } = useLocalSearchParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest({
          endpoint: `/trainee/reports/certifications/${assessmentId}`,
          method: 'GET',
        });
        
        setData(response?.data || response || null);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate details');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchCertificate();
    }
  }, [assessmentId]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Fetching certificate details...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={ms(48)} color={AppColors.placeholder} />
        <Text style={styles.errorText}>{error || 'Certificate not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const certificateData = {
    userName: data?.trainee?.name || data?.trainee_name || 'User',
    userEmail: data?.trainee?.email || data?.trainee_email || '',
    employeeId: data?.trainee?.employee_id || 'N/A',
    courseName: data?.program?.title || data?.title || 'N/A',
    score: `${data?.score || 0}/${data?.total_marks || 100}`,
    percent: `${data?.percentage || 0}%`,
    status: data?.status || 'PASS',
    timeTaken: data?.duration || 'N/A',
    attempt: `#${data?.attempt || 1}`,
    date: data?.issue_date ? new Date(data.issue_date).toLocaleDateString() : new Date().toLocaleDateString(),
    completedAt: data?.completed_at || '',
    certId: data?.certificate_id || 'N/A',
    questionsAttempted: `${data?.total_questions || 5}/${data?.total_questions || 5}`,
    submitMethod: data?.submit_method || 'Manual',
  };

  return (
    <View style={styles.container}>
      {/* Header with Buttons */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Certificate of Achievement</Text>
          <Text style={styles.certIdText}>{certificateData.certId}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtnGreen}>
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.actionBtnGray}>
            <Text style={styles.actionBtnTextGray}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Certificate Frame */}
        <View style={styles.certificateFrame}>
           <View style={styles.certBody}>
              <View style={styles.logoContainer}>
                <Ionicons name="person-circle" size={ms(60)} color={AppColors.teal} />
              </View>

              <Text style={styles.brandTitle}>Aavnta Medical</Text>
              <Text style={styles.headingText}>HEADING</Text>
              <Text style={styles.subheadingText}>in Healthcare Education</Text>

              <Text style={styles.awardedTo}>This certificate is awarded to</Text>
              <Text style={styles.studentName}>{certificateData.userName}</Text>
              <View style={styles.nameUnderline} />
              <Text style={styles.studentInfo}>Employee ID: {certificateData.employeeId} | {certificateData.userEmail}</Text>

              <Text style={styles.completionInfo}>for successfully completing the course in</Text>
              <Text style={styles.topicTitle}>{certificateData.courseName}</Text>
              <Text style={styles.programName}>Topic Certification Program</Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={styles.statValueGreen}>{certificateData.percent}</Text>
                  <Text style={styles.statLabel}>ACHIEVEMENT SCORE</Text>
                  <Text style={styles.statSub}>{certificateData.score} Correct</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={styles.statValueBlue}>{certificateData.status}</Text>
                  <Text style={styles.statLabel}>FINAL STATUS</Text>
                  <Text style={styles.statSub}>Passing: 60%</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#FFF8E1' }]}>
                  <Text style={styles.statValueAmber}>{certificateData.timeTaken}</Text>
                  <Text style={styles.statLabel}>TIME TAKEN</Text>
                  <Text style={styles.statSub}>Attempt {certificateData.attempt}</Text>
                </View>
              </View>

              {/* Detailed Grid */}
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ASSESSMENT DATE</Text>
                  <Text style={styles.detailValue}>{certificateData.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>COMPLETED ON</Text>
                  <Text style={styles.detailValue}>{certificateData.completedAt || certificateData.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>QUESTIONS ATTEMPTED</Text>
                  <Text style={styles.detailValue}>{certificateData.questionsAttempted}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>SUBMIT METHOD</Text>
                  <Text style={styles.detailValue}>{certificateData.submitMethod}</Text>
                </View>
              </View>

              {/* Footer Signatures */}
              <View style={styles.certFooter}>
                <View style={styles.signatureBox}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigName}>Signer Name</Text>
                  <Text style={styles.sigTitle}>Designation</Text>
                </View>
                <View style={styles.signatureBox}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigName}>Date of Issue</Text>
                  <Text style={styles.sigTitle}>{certificateData.date}</Text>
                </View>
              </View>

              <Text style={styles.verificationText}>Certificate Verification ID: {certificateData.certId}</Text>
              <Text style={styles.disclaimerText}>This certificate is digitally generated and valid without signature</Text>
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: wp(20),
  },
  loadingText: {
    marginTop: hp(10),
    fontSize: fs(14),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  errorText: {
    marginTop: hp(10),
    fontSize: fs(14),
    color: 'red',
    textAlign: 'center',
    marginBottom: hp(20),
  },
  retryBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: ms(8),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: hp(15),
    paddingHorizontal: wp(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1E3A8A',
  },
  certIdText: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    fontWeight: '600',
    marginTop: hp(2),
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp(10),
  },
  actionBtnGreen: {
    backgroundColor: '#10B981',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
  },
  actionBtnGray: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(8),
  },
  actionBtnText: {
    color: '#fff',
    fontSize: fs(13),
    fontWeight: '700',
  },
  actionBtnTextGray: {
    color: AppColors.textSecondary,
    fontSize: fs(13),
    fontWeight: '700',
  },
  scrollContent: {
    padding: wp(16),
  },
  certificateFrame: {
    backgroundColor: '#fff',
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: ms(4),
  },
  certBody: {
    borderWidth: 1,
    borderColor: '#10B981',
    padding: wp(20),
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: hp(10),
  },
  brandTitle: {
    fontSize: fs(24),
    fontWeight: '900',
    color: '#111827',
  },
  headingText: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#10B981',
    marginTop: hp(4),
    letterSpacing: 2,
  },
  subheadingText: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    marginTop: hp(2),
  },
  awardedTo: {
    fontSize: fs(14),
    color: AppColors.textSecondary,
    marginTop: hp(25),
  },
  studentName: {
    fontSize: fs(28),
    fontWeight: '900',
    color: '#111827',
    marginTop: hp(8),
  },
  nameUnderline: {
    height: 2,
    backgroundColor: '#10B981',
    width: wp(150),
    marginTop: hp(4),
  },
  studentInfo: {
    fontSize: fs(12),
    color: AppColors.textSecondary,
    marginTop: hp(10),
  },
  completionInfo: {
    fontSize: fs(14),
    color: AppColors.textSecondary,
    marginTop: hp(25),
  },
  topicTitle: {
    fontSize: fs(20),
    fontWeight: '800',
    color: '#111827',
    marginTop: hp(8),
  },
  programName: {
    fontSize: fs(12),
    fontWeight: '600',
    color: '#10B981',
    marginTop: hp(4),
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(30),
    width: '100%',
  },
  statBox: {
    flex: 1,
    paddingVertical: hp(12),
    alignItems: 'center',
    borderRadius: ms(8),
  },
  statValueGreen: {
    fontSize: fs(20),
    fontWeight: '900',
    color: '#059669',
  },
  statValueBlue: {
    fontSize: fs(20),
    fontWeight: '900',
    color: '#2563EB',
  },
  statValueAmber: {
    fontSize: fs(20),
    fontWeight: '900',
    color: '#D97706',
  },
  statLabel: {
    fontSize: fs(9),
    fontWeight: '800',
    color: AppColors.textSecondary,
    marginTop: hp(4),
  },
  statSub: {
    fontSize: fs(10),
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginTop: hp(2),
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9FAFB',
    width: '100%',
    marginTop: hp(30),
    padding: wp(15),
    gap: wp(20),
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: fs(9),
    fontWeight: '700',
    color: AppColors.placeholder,
    marginBottom: hp(4),
  },
  detailValue: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#374151',
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(50),
    paddingHorizontal: wp(10),
  },
  signatureBox: {
    alignItems: 'center',
    width: '40%',
  },
  sigLine: {
    height: 1,
    backgroundColor: '#D1D5DB',
    width: '100%',
    marginBottom: hp(8),
  },
  sigName: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#374151',
  },
  sigTitle: {
    fontSize: fs(10),
    color: AppColors.textSecondary,
    marginTop: hp(2),
  },
  verificationText: {
    fontSize: fs(9),
    color: AppColors.placeholder,
    marginTop: hp(40),
  },
  disclaimerText: {
    fontSize: fs(9),
    color: AppColors.placeholder,
    marginTop: hp(4),
    textAlign: 'center',
  },
});
