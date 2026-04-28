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
import { wp, hp, ms, fs, isSmallDevice } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';

export default function LevelResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('levels.level_result') || 'Level Result'}</Text>
        <View style={{ width: wp(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Section */}
          <View style={styles.celebrationSection}>
            <Text style={styles.partyEmoji}>🎉</Text>
            <Text 
              style={styles.wowText}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {t('common.wow')}
            </Text>
            <Text style={styles.congratsText}>{t('common.congrats')}</Text>
            <Text 
              style={styles.studentName}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              Jessica Parker
            </Text>
  
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>
                {t('levels.title_f1')}
              </Text>
            </View>
          </View>

        {/* Certificate Card */}
        <View style={styles.certificateCard}>
          <View style={styles.certInner}>
            {/* Certificate Header */}
            <View style={styles.certHeaderRow}>
              <View style={styles.certIconBox}>
                <Ionicons name="book" size={ms(18)} color="#8B6914" />
              </View>
              <View style={styles.certTitleContainer}>
                <Text style={styles.certTitle}>{t('common.cert_completion')}</Text>
              </View>
            </View>

            <View style={styles.certDivider} />

            {/* Certificate Details */}
            <View style={styles.certRow}>
              <Text style={styles.certLabel}>{t('common.issued_to')}</Text>
              <Text style={styles.certValue}>Jessica Parker</Text>
            </View>

            <View style={styles.certRow}>
              <Text style={styles.certLabel}>{t('common.program')}</Text>
              <View style={styles.certValueCol}>
                <Text style={styles.certValueSmall}>Masterclass: What is</Text>
                <Text style={styles.certValueSmall}>Pace Maker</Text>
              </View>
            </View>

            <View style={styles.certRow}>
              <Text style={styles.certLabel}>{t('common.completion_date')}</Text>
              <Text style={styles.certValue}>March 22, 2026</Text>
            </View>

            <View style={styles.certRow}>
              <Text style={styles.certLabel}>{t('common.cert_id')}</Text>
              <Text style={[styles.certValue, styles.certIdText]}>CH5303-8T0V</Text>
            </View>

            {/* Excellence Award Badge */}
            <View style={styles.awardBadge}>
              <Text 
                style={styles.awardBadgeText}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {t('common.excellence_award')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveCertBtn}
            onPress={() => router.push('/(tabs)/analytics/certificate')}
          >
            <Text style={styles.saveCertBtnText}>{t('common.save_cert')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareCertBtn}>
            <Text style={styles.shareCertBtnText}>{t('common.share_cert')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startNewBtn}
            onPress={() => router.push('/(tabs)/levels')}
          >
            <Text style={styles.startNewBtnText}>{t('common.start_new_level')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingBottom: hp(14),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(15),
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: AppColors.textWhite,
    fontSize: fs(isSmallDevice ? 15 : 17),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: wp(20),
    paddingBottom: hp(40),
    alignItems: 'center',
  },

  // Celebration Section
  celebrationSection: {
    alignItems: 'center',
    marginTop: hp(25),
    marginBottom: hp(20),
  },
  partyEmoji: {
    fontSize: fs(48),
    marginBottom: hp(8),
  },
  wowText: {
    fontSize: fs(isSmallDevice ? 22 : 26),
    fontWeight: '900',
    color: AppColors.warning,
    marginBottom: hp(8),
    letterSpacing: 1,
  },
  congratsText: {
    fontSize: fs(15),
    color: '#555',
    fontWeight: '500',
    marginBottom: hp(10),
  },
  studentName: {
    fontSize: fs(isSmallDevice ? 18 : 22),
    fontWeight: '900',
    color: AppColors.textDark,
    marginBottom: hp(14),
  },
  courseBadge: {
    backgroundColor: AppColors.badgePrimaryBg,
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#C5D9F7',
  },
  courseBadgeText: {
    color: AppColors.primary,
    fontSize: fs(12),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: fs(18),
  },

  // Certificate Card
  certificateCard: {
    width: '100%',
    backgroundColor: '#FFF9E8',
    borderRadius: ms(16),
    padding: wp(3),
    borderWidth: 2,
    borderColor: '#E8D9A8',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: hp(25),
  },
  certInner: {
    borderWidth: 1.5,
    borderColor: '#D4C48A',
    borderRadius: ms(13),
    borderStyle: 'dashed',
    paddingHorizontal: wp(isSmallDevice ? 12 : 16),
    paddingVertical: hp(isSmallDevice ? 14 : 18),
  },
  certHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  certIconBox: {
    width: wp(40),
    height: wp(40),
    borderRadius: ms(10),
    backgroundColor: '#F0E6C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  certTitleContainer: {
    flex: 1,
  },
  certTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#8B6914',
    letterSpacing: 0.3,
  },
  certDivider: {
    height: 1,
    backgroundColor: '#E8D9A8',
    marginBottom: hp(14),
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(12),
    paddingHorizontal: wp(2),
  },
  certLabel: {
    fontSize: fs(11),
    color: AppColors.placeholder,
    fontWeight: '600',
    flex: 1,
  },
  certValue: {
    fontSize: fs(12),
    color: AppColors.textDark,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1.2,
  },
  certValueCol: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  certValueSmall: {
    fontSize: fs(11),
    color: AppColors.textDark,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: fs(16),
  },
  certIdText: {
    color: AppColors.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  awardBadge: {
    backgroundColor: '#FFF3D0',
    borderRadius: ms(20),
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    alignSelf: 'center',
    marginTop: hp(6),
    borderWidth: 1,
    borderColor: '#F0D980',
  },
  awardBadgeText: {
    color: '#B8860B',
    fontSize: fs(11),
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Buttons
  actionsContainer: {
    width: '100%',
  },
  saveCertBtn: {
    width: '100%',
    height: hp(52),
    backgroundColor: AppColors.teal,
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
    elevation: 4,
    shadowColor: AppColors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveCertBtnText: {
    color: AppColors.textWhite,
    fontSize: fs(15),
    fontWeight: '700',
  },
  shareCertBtn: {
    width: '100%',
    height: hp(52),
    backgroundColor: '#fff',
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  shareCertBtnText: {
    color: AppColors.textDark,
    fontSize: fs(15),
    fontWeight: '700',
  },
  startNewBtn: {
    width: '100%',
    height: hp(52),
    backgroundColor: '#fff',
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  startNewBtnText: {
    color: AppColors.textDark,
    fontSize: fs(15),
    fontWeight: '700',
  },
});
