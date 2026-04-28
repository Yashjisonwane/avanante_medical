import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs, SCREEN_WIDTH, isSmallDevice } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';

const PROGRESS_DATA = {
  current: [
    {
      id: 1,
      title: 'analytics.item_def',
      subtitle: 'analytics.module_patho',
      progress: 100,
      hasCertificate: true,
    },
    {
      id: 2,
      title: 'analytics.item_hist',
      subtitle: 'analytics.module_patho',
      progress: 75,
      hasCertificate: false,
    },
  ],
  past: [
    {
      id: 3,
      title: 'analytics.item_types',
      subtitle: 'analytics.module_fund',
      progress: 100,
      hasCertificate: true,
    },
    {
      id: 4,
      title: 'analytics.item_key',
      subtitle: 'analytics.module_basics',
      progress: 100,
      hasCertificate: true,
    },
  ],
};

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'past'

  useEffect(() => {
    let backHandlerSubscription = null;

    const onBackPress = () => {
      // Prevent navigating back to Home tab - stay in flow
      return true;
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
        backHandlerSubscription = null;
      }
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
      }
    };
  }, [navigation]);

  const progressItems = activeTab === 'current' ? PROGRESS_DATA.current : PROGRESS_DATA.past;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        {/* Top green accent bar */}
        <View style={styles.greenAccentBar} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="chevron-back" size={ms(20)} color="#fff" />
          </TouchableOpacity>
          <Text 
            style={styles.headerTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('analytics.learning_progress')}
          </Text>
          <View style={{ width: wp(36) }} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(100) }}
      >
        {/* Stats Cards Row */}
        <View style={styles.statsCardsRow}>
          {/* Completed Levels */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardTop}>
              <Text style={styles.statsCardLabel}>{t('analytics.levels')}</Text>
              <View style={styles.statsIconRow}>
                <View style={[styles.statsIconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={ms(14)} color="#4CAF50" />
                </View>
                <View style={[styles.statsIconCircle, { backgroundColor: '#E3F2FD', marginLeft: -wp(6) }]}>
                  <Ionicons name="school" size={ms(14)} color={AppColors.primary} />
                </View>
              </View>
            </View>
            <Text 
              style={styles.statsNumber}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              1
            </Text>
            <Text style={styles.statsStatus}>{t('home.completed')}</Text>
          </View>

          <View style={styles.statsDivider} />

          {/* Pending Levels */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardTop}>
              <Text style={styles.statsCardLabel}>{t('analytics.pending_levels')}</Text>
              <View style={[styles.statsIconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="time" size={ms(14)} color="#FF9800" />
              </View>
            </View>
            <Text style={styles.statsNumber}>2</Text>
            <Text style={[styles.statsStatus, { color: '#FF5252' }]}>{t('analytics.incomplete')}</Text>
          </View>
        </View>

        {/* AVG Score Section */}
        <View style={styles.avgScoreCard}>
          <View style={styles.avgScoreTop}>
            <Text style={styles.avgScoreLabel}>AVG. SCORE</Text>
            <View style={styles.trendIconContainer}>
              <Ionicons name="trending-up" size={ms(16)} color={AppColors.primary} />
            </View>
          </View>
          
          <View style={styles.avgScoreBottom}>
            <View style={{ flex: 1 }}>
              <Text 
                style={styles.avgScoreValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                92%
              </Text>
              <Text style={styles.avgScoreSubtitle}>{t('analytics.top_percent')}</Text>
            </View>
            <View style={styles.avgScoreProgressContainer}>
              <View style={styles.avgScoreProgressBarBg}>
                <View style={[styles.avgScoreProgressBarFill, { width: '92%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Current Progress / Past Level Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <Text 
              style={styles.sectionTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {activeTab === 'current' ? t('chapters.current_progress') : t('analytics.past_levels')}
            </Text>
            <TouchableOpacity
              style={styles.pastLevelBtn}
              onPress={() => setActiveTab(activeTab === 'current' ? 'past' : 'current')}
            >
              <Text style={styles.pastLevelBtnText}>
                {activeTab === 'current' ? t('analytics.past_level') : t('chapters.current_progress')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Items */}
          {progressItems.map((item) => (
            <View key={item.id} style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <View style={styles.progressInfo}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons 
                      name="flask-outline" 
                      size={ms(24)} 
                      color={AppColors.primary} 
                    />
                  </View>
                  <View style={styles.progressTextBlock}>
                    <Text style={styles.progressTitle}>{t(item.title)}</Text>
                    <Text style={styles.progressSubtitle}>{t(item.subtitle)}</Text>
                  </View>
                </View>
                <View style={styles.progressPercentContainer}>
                  <Text style={[
                      styles.progressPercent,
                      { color: AppColors.primary }
                    ]}>
                    {item.progress}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor: AppColors.primary,
                    },
                  ]}
                />
              </View>

              {/* Action Button */}
              {item.hasCertificate ? (
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => router.push('/(tabs)/analytics/level-result')}
                >
                  <Text style={styles.actionBtnText}>{t('analytics.view_certificate')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => router.push('/(tabs)/levels')}
                >
                  <Text style={styles.actionBtnText}>{t('levels.continue_learning')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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

  /* ─── Header ─────────────────────────────────────── */
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
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: AppColors.textWhite,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  headerIconBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {},
  avatarCircle: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#fff',
  },

  /* ─── Content ────────────────────────────────────── */
  content: {
    flex: 1,
  },

  /* ─── Stats Cards ────────────────────────────────── */
  statsCardsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.backgroundWhite,
    marginHorizontal: wp(20),
    marginTop: hp(20),
    borderRadius: ms(16),
    padding: wp(20),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statsCard: {
    flex: 1,
  },
  statsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(6),
  },
  statsCardLabel: {
    fontSize: fs(10),
    fontWeight: '800',
    color: AppColors.textSecondary,
    letterSpacing: 1.2,
    lineHeight: fs(14),
  },
  statsIconRow: {
    flexDirection: 'row',
  },
  statsIconCircle: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsNumber: {
    fontSize: fs(isSmallDevice ? 32 : 38),
    fontWeight: '900',
    color: AppColors.textDark,
    lineHeight: fs(isSmallDevice ? 36 : 42),
    marginBottom: hp(2),
  },
  statsStatus: {
    fontSize: fs(11),
    fontWeight: '700',
    color: AppColors.teal,
    letterSpacing: 0.3,
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: wp(isSmallDevice ? 10 : 16),
  },

  /* ─── AVG Score ──────────────────────────────────── */
  avgScoreCard: {
    backgroundColor: AppColors.backgroundWhite,
    marginHorizontal: wp(isSmallDevice ? 12 : 20),
    marginTop: hp(16),
    borderRadius: ms(16),
    padding: wp(isSmallDevice ? 15 : 16),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avgScoreTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgScoreLabel: {
    fontSize: fs(11),
    fontWeight: '800',
    color: AppColors.textSecondary,
    letterSpacing: 1.2,
  },
  trendIconContainer: {
    width: wp(32),
    height: wp(32),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgScoreBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: hp(8),
  },
  avgScoreValue: {
    fontSize: fs(38),
    fontWeight: '900',
    color: AppColors.textDark,
    lineHeight: fs(42),
  },
  avgScoreSubtitle: {
    fontSize: fs(12),
    fontWeight: '500',
    color: AppColors.textSecondary,
    marginTop: hp(2),
  },
  avgScoreProgressContainer: {
    flex: 1,
    marginLeft: wp(isSmallDevice ? 15 : 30),
    marginBottom: hp(8),
  },
  avgScoreProgressBarBg: {
    height: hp(8),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(4),
    width: '100%',
  },
  avgScoreProgressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: ms(4),
  },

  /* ─── Toggle Section ─────────────────────────────── */
  toggleSection: {
    marginTop: hp(20),
    paddingHorizontal: wp(isSmallDevice ? 12 : 20),
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: AppColors.textDark,
  },
  toggleBtnContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF5',
    borderRadius: ms(20),
    padding: wp(3),
  },
  pastLevelBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: ms(8),
  },
  pastLevelBtnText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#fff',
  },
  toggleBtn: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: ms(18),
  },
  toggleBtnActive: {
    backgroundColor: AppColors.primary,
  },
  toggleBtnText: {
    fontSize: fs(10),
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#fff',
  },

  /* ─── Progress Card ──────────────────────────────── */
  progressCard: {
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
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(12),
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  progressTextBlock: {
    flex: 1,
  },
  progressTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: hp(2),
  },
  progressSubtitle: {
    fontSize: fs(11),
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  progressPercentContainer: {
    marginLeft: wp(10),
  },
  progressPercent: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  progressBarBg: {
    height: hp(4),
    backgroundColor: '#E8EDF5',
    borderRadius: ms(2),
    marginBottom: hp(16),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: ms(2),
  },
  actionBtn: {
    backgroundColor: AppColors.teal,
    paddingVertical: hp(12),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#fff',
  },
});
