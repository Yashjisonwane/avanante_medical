import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';

export default function CertificateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('certificate.my_certificate')}</Text>
        <View style={{ width: wp(40) }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Certificate Card */}
        <View style={styles.certOuterBorder}>
           <View style={styles.certInnerBorder}>
              <Text style={styles.logoTitle}>AVANTE MEDICAL</Text>
              <Text style={styles.logoSubtitle}>{t('certificate.lms')}</Text>

              <Text style={styles.certifyText}>{t('certificate.certify_that')}</Text>
              
              <View style={styles.nameContainer}>
                 <Text style={styles.studentName}>Alex J. Harrison</Text>
                 <View style={styles.nameUnderline} />
              </View>

              <Text style={styles.completionText}>{t('certificate.completed_course')}</Text>

              <Text style={styles.courseTitle}>{t('levels.title_f1')}</Text>

              <Text style={styles.dateText}>{t('certificate.issued_on', { date: 'October 24, 2026' })}</Text>
           </View>
        </View>

        {/* Action Buttons */}
         <TouchableOpacity style={styles.downloadBtn}>
            <Ionicons name="download-outline" size={ms(20)} color="#fff" />
            <Text style={styles.downloadBtnText}>{t('certificate.download_pdf')}</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="logo-linkedin" size={ms(20)} color="#3069F7" />
            <Text style={styles.shareBtnText}>{t('certificate.share_linkedin')}</Text>
         </TouchableOpacity>



      </ScrollView>
      <View style={styles.footerFixed}>
        <Text style={styles.verifyText}>{t('certificate.verify_id', { id: 'AV-9982-XM-2026' })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingBottom: hp(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(15),
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: AppColors.textWhite,
    fontSize: fs(16),
    fontWeight: '700',
  },
  content: {
    padding: wp(16),
    paddingBottom: hp(20),
    alignItems: 'center',
  },
  footerFixed: {
    paddingBottom: hp(15),
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  certOuterBorder: {
    width: '100%',
    backgroundColor: AppColors.backgroundWhite,
    padding: wp(8),
    marginTop: 0,
    borderWidth: 3,
    borderColor: '#38BDF8',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: hp(20),
  },
  certInnerBorder: {
    borderWidth: 3,
    borderColor: '#24458B',
    borderStyle: 'solid',
    paddingVertical: hp(15),
    paddingHorizontal: wp(15),
    alignItems: 'center',
  },
  logoTitle: {
    color: AppColors.primaryDark,
    fontSize: fs(16),
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: hp(4),
  },
  logoSubtitle: {
    color: '#A0AABF',
    fontSize: fs(8),
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: hp(15),
  },
  certifyText: {
    color: AppColors.textSecondary,
    fontSize: fs(14),
    marginBottom: hp(15),
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: hp(10),
    width: '80%',
  },
  studentName: {
    fontSize: fs(22),
    fontWeight: '900',
    color: AppColors.textDark,
    marginBottom: hp(6),
    textAlign: 'center',
  },
  nameUnderline: {
    height: 1,
    backgroundColor: '#D1D5DB',
    width: '100%',
  },
  completionText: {
    color: AppColors.textSecondary,
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: hp(20),
  },
  courseTitle: {
    color: AppColors.primaryDark,
    fontSize: fs(15),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: hp(15),
  },
  dateText: {
    color: '#8898AA',
    fontSize: fs(10),
    fontWeight: '500',
  },
  downloadBtn: {
    width: '100%',
    height: hp(45),
    backgroundColor: AppColors.teal,
    borderRadius: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
    gap: wp(8),
    elevation: 3,
    shadowColor: AppColors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  downloadBtnText: {
    color: AppColors.textWhite,
    fontSize: fs(16),
    fontWeight: '800',
  },
  shareBtn: {
    width: '100%',
    height: hp(45),
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    borderRadius: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
    gap: wp(8),
  },
  shareBtnText: {
    color: AppColors.primary,
    fontSize: fs(16),
    fontWeight: '800',
  },
  verifyText: {
    color: '#9CA3AF',
    fontSize: fs(11),
    fontWeight: '500',
  },
});
