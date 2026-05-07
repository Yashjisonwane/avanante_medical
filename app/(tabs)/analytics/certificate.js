import React, { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest } from '../../../redux/api/baseApi';
import { useDispatch, useSelector } from 'react-redux';
import * as Linking from 'expo-linking';
import { Share, Alert } from 'react-native';

export default function CertificateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { assessmentId } = useLocalSearchParams();
  const { topicContent, currentTopic } = useSelector((state) => state.course);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { fetchProfile } = require('../../../redux/slices/authSlice');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest({
          endpoint: `/trainee/reports/certificate/${assessmentId}`,
          method: 'GET',
        });
        
        const certData = response?.data || response;
        if (certData && typeof certData === 'object') {
          setData(certData);
        } else {
          setError('Invalid certificate data received');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate details');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchCertificate();
    } else {
      setError('Certificate ID is missing');
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [dispatch, user]);

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
    userName: data?.meta?.user?.name || data?.user_name || data?.trainee?.name || data?.trainee_name || user?.name || 'User',
    userEmail: data?.meta?.user?.email || data?.email || data?.trainee?.email || data?.user_email || user?.email || '',
    employeeId: data?.meta?.user?.employee_id || data?.employee_id || data?.trainee?.employee_id || user?.employee_id || 'N/A',
    courseName: data?.meta?.context?.title || data?.program || data?.course_name || 'N/A',
    score: `${data?.meta?.result?.score || data?.score || 0}/${data?.meta?.marks?.total_marks || data?.total_marks || 5}`,
    percent: `${data?.meta?.result?.percentage || data?.percentage || 0}%`,
    status: String(data?.meta?.result?.status || data?.certificate_status || data?.status || 'PASS').toUpperCase(),
    timeTaken: data?.meta?.time?.time_taken_seconds ? `${Math.round(data.meta.time.time_taken_seconds)}s` : (data?.duration || data?.time_taken || 'N/A'),
    attempt: `#${data?.meta?.attempt?.attempt_id || data?.attempt || 1}`,
    date: (data?.issued_at || data?.certificate_issue_date || data?.issue_date) ? new Date(data?.issued_at || data?.certificate_issue_date || data?.issue_date).toLocaleDateString() : new Date().toLocaleDateString(),
    completedAt: data?.meta?.time?.submitted_at || data?.completed_at || '',
    certId: data?.certificate_id || data?.cert_id || data?.id || 'N/A',
    questionsAttempted: `${data?.meta?.questions?.attempted || 5}/${data?.meta?.questions?.total || 5}`,
    submitMethod: data?.meta?.attempt?.submit_type || data?.submit_method || 'Manual',
    
    // Links
    shareLinks: data?.share_links || {},
    publicUrl: data?.share_links?.whatsapp?.split('text=')[1]?.split(' ')[1] || `https://lms-backend.netswaptech.com/certificate/${data?.certificate_id || data?.cert_id}`,

    // Design details
    design: data?.design || {}
  };

  const handleDownload = () => {
    Alert.alert('Coming Soon', 'Certificate download feature will be available soon.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I have successfully completed the course "${certificateData.courseName}" on Avante Medical LMS! 🎓\nCheck out my certificate: ${certificateData.publicUrl}`,
        url: certificateData.publicUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const openSocialLink = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Buttons */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>View Certificate</Text>
          <Text style={styles.certIdText}>{certificateData.certId}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtnCircle}>
          <Ionicons name="share-social" size={22} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.topActions}>
          <TouchableOpacity onPress={handleDownload} style={styles.mainDownloadBtn}>
            <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.mainDownloadText}>Download Certificate (PDF)</Text>
          </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Certificate Frame */}
        <View style={styles.certificateOuterFrame}>
          <View style={styles.certBody}>
            {/* Decorative Leaf Corners */}
            <View style={styles.leafCornerTopLeft}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>
            <View style={styles.leafCornerTopRight}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>
            <View style={styles.leafCornerBottomLeft}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>
            <View style={styles.leafCornerBottomRight}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>

            {/* Company Logo or Title */}
            {certificateData.design?.company_logo ? (
               <Image 
                 source={{ uri: certificateData.design.company_logo }} 
                 style={styles.companyLogo}
                 resizeMode="contain"
               />
            ) : (
               <View style={{ alignItems: 'center' }}>
                 <Text style={styles.brandTitle}>{certificateData.design?.company_name || 'Aavnta Medical'}</Text>
                 <Text style={styles.taglineText}>{certificateData.design?.tagline || 'Avante Sales Training App'}</Text>
               </View>
            )}
            
            <View style={styles.starContainer}>
              <Ionicons name="star" size={ms(16)} color="#10B981" />
            </View>

            <Text style={styles.headingText}>{certificateData.design?.certificate_title || 'CERTIFICATE OF ACHIEVEMENT'}</Text>
            
            <View style={styles.achievementRow}>
              <Ionicons name="trophy-outline" size={ms(14)} color="#10B981" />
              <Text style={styles.achievementText}> {certificateData.design?.achievement_text || 'OF ACHIEVEMENT'} </Text>
              <Ionicons name="trophy-outline" size={ms(14)} color="#10B981" />
            </View>

            <Text style={styles.awardedTo}>{certificateData.design?.presentation_text || 'This certificate is proudly presented to'}</Text>
            <Text style={styles.studentName}>{certificateData.userName}</Text>
            <View style={styles.nameUnderline} />

            <View style={styles.idEmailRow}>
               <View style={styles.idItem}>
                 <Ionicons name="card-outline" size={ms(12)} color="#10B981" />
                 <Text style={styles.idText}> Employee ID: {certificateData.employeeId}</Text>
               </View>
               <View style={styles.idItem}>
                 <Ionicons name="mail-outline" size={ms(12)} color="#10B981" />
                 <Text style={styles.idText}> {certificateData.userEmail}</Text>
               </View>
            </View>

            {/* 3-Column Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statColumn}>
                <Ionicons name="stats-chart-outline" size={ms(18)} color="#10B981" />
                <Text style={styles.statLargeValue}>{certificateData.percent}</Text>
                <Text style={styles.statLabel}>{certificateData.design?.stat_label_score || 'ACHIEVEMENT SCORE'}</Text>
                <Text style={styles.statSub}>{certificateData.score} Questions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Ionicons name="checkmark-circle-outline" size={ms(18)} color="#10B981" />
                <Text style={styles.statLargeValue}>{certificateData.status}</Text>
                <Text style={styles.statLabel}>{certificateData.design?.stat_label_status || 'FINAL STATUS'}</Text>
                <Text style={styles.statSub}>Passing Score: 60%</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Ionicons name="time-outline" size={ms(18)} color="#10B981" />
                <Text style={styles.statLargeValue}>{certificateData.timeTaken}</Text>
                <Text style={styles.statLabel}>{certificateData.design?.stat_label_time || 'TIME TAKEN'}</Text>
                <Text style={styles.statSub}>Attempt {certificateData.attempt}</Text>
              </View>
            </View>

            {/* Assessment Details Box */}
            <View style={styles.detailsBox}>
               <View style={styles.detailsHeader}>
                  <Text style={styles.detailsHeaderText}>{certificateData.design?.details_header || 'ASSESSMENT DETAILS'}</Text>
               </View>
               <View style={styles.detailsGrid}>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="calendar-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>ASSESSMENT DATE</Text>
                           <Text style={styles.dValue}>{certificateData.date}</Text>
                        </View>
                     </View>
                  </View>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="help-circle-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>QUESTIONS ATTEMPTED</Text>
                           <Text style={styles.dValue}>{certificateData.questionsAttempted}</Text>
                        </View>
                     </View>
                  </View>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="trophy-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>CORRECT ANSWERS</Text>
                           <Text style={styles.dValueGreen}>{certificateData.score.split('/')[0]} correct ({certificateData.percent})</Text>
                        </View>
                     </View>
                  </View>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="book-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>COURSE TYPE</Text>
                           <Text style={styles.dValue}>Topic</Text>
                        </View>
                     </View>
                  </View>
               </View>
            </View>

            {/* Signatures */}
            <View style={styles.footerSignatures}>
               <View style={styles.sigBlock}>
                  {certificateData.design?.signature_image ? (
                     <Image 
                       source={{ uri: certificateData.design.signature_image }} 
                       style={styles.signatureImage}
                       resizeMode="contain"
                     />
                  ) : (
                     <Text style={styles.sigNameText}>{certificateData.design?.signer_name || 'Dr. John Doe'}</Text>
                  )}
                  <View style={styles.sigLine} />
                  <Text style={styles.sigTitleText}>{certificateData.design?.signer_designation || 'Head of Training'}</Text>
               </View>
               <View style={styles.sigBlock}>
                  <Text style={styles.sigNameText}>{certificateData.date}</Text>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigTitleText}>Date of Issue</Text>
               </View>
            </View>

            <Text style={styles.footerId}>Certificate ID: {certificateData.certId}</Text>
            <Text style={styles.footerDisclaimer}>{certificateData.design?.footer_text || 'This certificate is digitally generated and does not require a physical signature.'}</Text>
            <View style={styles.verifiedRow}>
               <Ionicons name="checkmark-done-circle" size={ms(12)} color="#A0AEC0" />
               <Text style={styles.verifiedText}> Digitally Verified Certificate</Text>
            </View>
          </View>
        </View>

        {/* Social Sharing Section */}
        <View style={styles.socialShareSection}>
           <Text style={styles.shareTitle}>Share Your Achievement</Text>
           <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#25D366' }]}
                onPress={() => openSocialLink(certificateData.shareLinks?.whatsapp)}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#0077B5' }]}
                onPress={() => openSocialLink(certificateData.shareLinks?.linkedin)}
              >
                <Ionicons name="logo-linkedin" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => openSocialLink(certificateData.shareLinks?.facebook)}
              >
                <Ionicons name="logo-facebook" size={24} color="#fff" />
              </TouchableOpacity>
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
    paddingHorizontal: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  shareBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(12),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#1E3A8A',
  },
  certIdText: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '600',
    marginTop: hp(2),
  },
  topActions: {
    padding: wp(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mainDownloadBtn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    height: hp(50),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainDownloadText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  scrollContent: {
    padding: wp(12),
    paddingBottom: hp(40),
  },
  certificateOuterFrame: {
    backgroundColor: '#fff',
    padding: wp(4),
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: ms(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  certBody: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: wp(16),
    paddingVertical: hp(30),
    alignItems: 'center',
    position: 'relative',
  },
  leafCornerTopLeft: { position: 'absolute', top: 10, left: 10 },
  leafCornerTopRight: { position: 'absolute', top: 10, right: 10 },
  leafCornerBottomLeft: { position: 'absolute', bottom: 10, left: 10 },
  leafCornerBottomRight: { position: 'absolute', bottom: 10, right: 10 },
  
  companyLogo: {
    width: wp(180),
    height: hp(60),
    marginBottom: hp(10),
  },
  signatureImage: {
    width: wp(120),
    height: hp(50),
    marginBottom: hp(5),
  },
  sigLine: {
    height: 1,
    width: wp(120),
    backgroundColor: '#E5E7EB',
    marginVertical: hp(8),
  },
  
  brandTitle: {
    fontSize: fs(24),
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: 1,
  },
  taglineText: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '700',
    marginTop: hp(2),
  },
  starContainer: {
    marginVertical: hp(10),
  },
  headingText: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
    textAlign: 'center',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
  },
  achievementText: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#10B981',
  },
  awardedTo: {
    fontSize: fs(13),
    color: '#4B5563',
    marginTop: hp(25),
  },
  studentName: {
    fontSize: fs(34),
    fontWeight: '900',
    color: '#064E3B',
    marginTop: hp(8),
    textAlign: 'center',
  },
  nameUnderline: {
    height: 2,
    backgroundColor: '#10B981',
    width: '80%',
    marginTop: hp(4),
  },
  idEmailRow: {
    flexDirection: 'row',
    gap: wp(15),
    marginTop: hp(12),
  },
  idItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idText: {
    fontSize: fs(11),
    color: '#6B7280',
    fontWeight: '600',
  },
  completionInfo: {
    fontSize: fs(13),
    color: '#4B5563',
    marginTop: hp(35),
    textAlign: 'center',
  },
  topicTitle: {
    fontSize: fs(20),
    fontWeight: '800',
    color: '#064E3B',
    marginTop: hp(8),
    textAlign: 'center',
  },
  programName: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#10B981',
    marginTop: hp(6),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: hp(40),
    paddingHorizontal: wp(10),
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLargeValue: {
    fontSize: fs(24),
    fontWeight: '900',
    color: '#064E3B',
    marginTop: hp(8),
  },
  statLabel: {
    fontSize: fs(9),
    fontWeight: '800',
    color: '#374151',
    marginTop: 2,
  },
  statSub: {
    fontSize: fs(9),
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: hp(60),
    backgroundColor: '#E5E7EB',
  },
  detailsBox: {
    width: '100%',
    marginTop: hp(40),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: ms(4),
  },
  detailsHeader: {
    backgroundColor: '#F9FAFB',
    paddingVertical: hp(8),
    paddingHorizontal: wp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsHeaderText: {
    fontSize: fs(11),
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: wp(15),
  },
  detailsItem: {
    width: '50%',
    marginBottom: hp(15),
  },
  detailsIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dLabel: {
    fontSize: fs(8),
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dValue: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#374151',
  },
  dValueGreen: {
    fontSize: fs(11),
    fontWeight: '800',
    color: '#10B981',
  },
  footerSignatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(50),
    paddingHorizontal: wp(20),
  },
  sigBlock: {
    alignItems: 'center',
  },
  sigNameText: {
    fontSize: fs(13),
    fontWeight: '800',
    color: '#111827',
  },
  sigTitleText: {
    fontSize: fs(10),
    color: '#6B7280',
    marginTop: hp(2),
  },
  footerId: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '700',
    marginTop: hp(40),
  },
  footerDisclaimer: {
    fontSize: fs(9),
    color: '#9CA3AF',
    marginTop: hp(6),
    textAlign: 'center',
    paddingHorizontal: wp(20),
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(8),
  },
  verifiedText: {
    fontSize: fs(9),
    color: '#A0AEC0',
    fontWeight: '600',
  },
  socialShareSection: {
    marginTop: hp(30),
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: wp(20),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shareTitle: {
    fontSize: fs(14),
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: hp(15),
  },
  socialButtons: {
    flexDirection: 'row',
    gap: wp(15),
  },
  socialBtn: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
