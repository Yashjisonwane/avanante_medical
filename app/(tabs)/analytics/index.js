import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs, SCREEN_WIDTH, isSmallDevice } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { fetchDashboard } from '../../../redux/slices/courseSlice';

const ModuleAccordion = ({ module, chapters }) => {
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();

  return (
    <View style={styles.moduleItem}>
      <TouchableOpacity 
        style={styles.moduleHeader} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.moduleHeaderLeft}>
          <View style={styles.moduleDot} />
          <View style={[styles.gridIconBox, { backgroundColor: '#EFF6FF', width: ms(24), height: ms(24), marginRight: 8 }]}>
            <Ionicons name="folder-open" size={ms(14)} color={AppColors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.moduleTitle}>{module.module_title}</Text>
            <View style={styles.moduleMeta}>
              <View style={styles.moduleBarTrack}>
                <View style={[styles.moduleBarFill, { width: `${module.progress_percent}%` }]} />
              </View>
              <Text style={styles.modulePercent}>{(parseFloat(module.progress_percent) || 0).toFixed(1)}%</Text>
              <Text style={styles.moduleFraction}>{t('analytics.module_fraction', { completed: module.completed_topics, total: module.total_topics })}</Text>
            </View>
          </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={AppColors.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.chaptersList}>
          {chapters?.map((chapter) => (
            <View key={chapter.chapter_id} style={styles.chapterItem}>
              <View style={styles.chapterIconBox}>
                {chapter.progress_percent === 100 ? (
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                ) : chapter.progress_percent > 0 ? (
                  <ActivityIndicator size="small" color={AppColors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                ) : (
                  <Ionicons name="lock-closed" size={12} color="#CBD5E1" />
                )}
              </View>
              <View style={[styles.gridIconBox, { backgroundColor: '#F8FAFC', width: ms(20), height: ms(20), marginRight: 8 }]}>
                <Ionicons name="document-text" size={ms(10)} color={AppColors.textSecondary} />
              </View>
              <Text style={styles.chapterTitle}>{chapter.chapter_title}</Text>
              <Text style={styles.chapterPercent}>{(parseFloat(chapter.progress_percent) || 0).toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};



export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { dashboard, loading } = useSelector((state) => state.course);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const stats = dashboard?.stats || {};

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        dispatch(fetchDashboard());
      }
    }, [dispatch, isAuthenticated])
  );




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
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>{t('analytics.progress_dashboard', { defaultValue: 'Progress Dashboard' })}</Text>
          <Text style={styles.dashboardSubtitle}>{t('analytics.progress_dashboard_desc', { defaultValue: 'Track your learning progress across modules and chapters' })}</Text>
        </View>

        {/* 4 Cards Grid */}
        <View style={styles.statsGrid}>
          {/* Levels Completed */}
          <View style={styles.gridCard}>
            <View style={styles.gridCardTop}>
              <Text style={styles.gridCardLabel}>{t('analytics.levels_completed')}</Text>
              <View style={[styles.gridIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="trophy" size={ms(18)} color="#2563EB" />
              </View>
            </View>
            <Text style={styles.gridNumber}>{stats.completed_levels || 0}</Text>
            <Text style={styles.gridSubtext}>
              {stats.in_progress_levels || 0} {t('analytics.in_progress')}
            </Text>
          </View>

          {/* Certificates */}
          <View style={styles.gridCard}>
            <View style={styles.gridCardTop}>
              <Text style={styles.gridCardLabel}>{t('analytics.certificates')}</Text>
              <View style={[styles.gridIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="ribbon" size={ms(18)} color="#10B981" />
              </View>
            </View>
            <Text style={styles.gridNumber}>{stats.total_certificates || 0}</Text>
            <Text style={styles.gridSubtext}>
              {t('analytics.avg_score_label', { score: stats.avg_score || 0 })}
            </Text>
          </View>

          {/* AVG Score */}
          <View style={styles.gridCard}>
            <View style={styles.gridCardTop}>
              <Text style={styles.gridCardLabel}>{t('analytics.avg_score')}</Text>
              <View style={[styles.gridIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="bar-chart" size={ms(18)} color="#7C3AED" />
              </View>
            </View>
            <Text style={styles.gridNumber}>{stats.avg_score || 0}%</Text>
            <Text style={styles.gridSubtext}>{t('analytics.overall_performance')}</Text>
          </View>

          {/* Topics Completed */}
          <View style={styles.gridCard}>
            <View style={styles.gridCardTop}>
              <Text style={styles.gridCardLabel}>{t('analytics.topics_completed')}</Text>
              <View style={[styles.gridIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="book" size={ms(18)} color="#EA580C" />
              </View>
            </View>
            <Text style={styles.gridNumber}>
              {stats.completed_topics || 0}/{stats.total_topics || 0}
            </Text>
            <Text style={styles.gridSubtext}>
              {stats.total_topics > 0 
                ? (((parseFloat(stats.completed_topics) || 0) / stats.total_topics) * 100).toFixed(1)
                : (parseFloat(stats.progress_percent) || 0).toFixed(1)}% {t('analytics.complete')}
            </Text>
          </View>
        </View>

        {/* Dashboard Sections Wrapper */}
        <View style={styles.dashboardGrid}>
          {/* Left Column: Current Focus & Quick Stats */}
          <View style={styles.leftColumn}>
            {/* CURRENT FOCUS */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleSmall}>{t('analytics.current_focus')}</Text>
              <View style={styles.focusContent}>
                <Text style={styles.focusProgram}>{dashboard?.current_learning?.program?.title}</Text>
                
                <View style={styles.focusSteps}>
                  <View style={styles.focusStep}>
                    <Ionicons name="folder-outline" size={14} color={AppColors.primary} />
                    <Text style={styles.focusStepLabel}>{t('modules.details_title', { defaultValue: 'Module' }).split(' ')[0]}</Text>
                    <Text style={styles.focusStepValue}>{dashboard?.current_learning?.module?.title}</Text>
                  </View>
                  <View style={styles.focusStep}>
                    <Ionicons name="document-text-outline" size={14} color={AppColors.primary} />
                    <Text style={styles.focusStepLabel}>{t('chapters.details_title', { defaultValue: 'Chapter' }).split(' ')[0]}</Text>
                    <Text style={styles.focusStepValue}>{dashboard?.current_learning?.chapter?.title}</Text>
                  </View>
                  <View style={styles.focusStep}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.focusStepLabel}>{t('analytics.topic_label', { defaultValue: 'Topic' })}</Text>
                    <Text style={styles.focusStepValueBold}>{dashboard?.current_learning?.topic?.title}</Text>
                  </View>
                </View>

                 <View style={styles.focusProgressBox}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{t('levels.level_progress', { defaultValue: 'Topic Progress' })}</Text>
                    <Text style={styles.progressValue}>{(parseFloat(dashboard?.current_learning?.progress_percent) || 0).toFixed(1)}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${parseFloat(dashboard?.current_learning?.progress_percent) || 0}%`, backgroundColor: AppColors.primary }]} />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.continueBtn}
                  onPress={() => {
                    if (dashboard?.current_learning?.cta?.topic_id) {
                      router.push({ pathname: '/(tabs)/levels/topic-details', params: { id: dashboard.current_learning.cta.topic_id } });
                    }
                  }}
                >
                  <Ionicons name="play-circle" size={20} color="#fff" />
                  <Text style={styles.continueBtnText}>{t('analytics.continue_learning', { defaultValue: 'Continue Learning' })}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleSmall}>{t('analytics.quick_stats')}</Text>
              <View style={styles.quickStatsList}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatLabel}>{t('analytics.total_topics_label')}</Text>
                  <Text style={styles.quickStatValue}>{dashboard?.current_learning?.total_lessons || 0}</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatLabel}>{t('analytics.completed_label')}</Text>
                  <Text style={[styles.quickStatValue, { color: '#10B981' }]}>{dashboard?.current_learning?.completed_lessons || 0}</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatLabel}>{t('analytics.in_progress_label')}</Text>
                  <Text style={[styles.quickStatValue, { color: '#2563EB' }]}>{stats.in_progress_levels || 0}</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatLabel}>{t('analytics.pending_quizzes_label')}</Text>
                  <Text style={[styles.quickStatValue, { color: '#F59E0B' }]}>{dashboard?.current_learning?.pending_quizzes || 0}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column: Module & Chapter Hierarchy */}
          <View style={styles.rightColumn}>
            <View style={styles.sectionCard}>
              <View style={styles.hierarchyHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="folder" size={18} color={AppColors.primary} />
                  <Text style={[styles.sectionTitleSmall, { marginBottom: 0, marginLeft: 8 }]}>{t('analytics.module_chapter_hierarchy')}</Text>
                </View>
                <Text style={styles.hierarchyCount}>{stats.modules_progress?.length || 0} {t('home.modules', { defaultValue: 'modules' }).toLowerCase()}</Text>
              </View>

              <View style={styles.hierarchyList}>
                {stats.modules_progress?.map((module, idx) => (
                  <ModuleAccordion 
                    key={module.module_id} 
                    module={module} 
                    chapters={stats.chapters_progress?.filter(c => c.module_id === module.module_id)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.toggleSection}>

          {/* Audit Logs Card */}
          <View style={styles.auditLogCard}>
            <View style={styles.progressCardHeader}>
              <View style={styles.progressInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="list" size={ms(24)} color="#10B981" />
                </View>
                <View style={styles.progressTextBlock}>
                  <Text style={styles.progressTitle}>{t('analytics.audit_logs', { defaultValue: 'System Audit Logs' })}</Text>
                  <Text style={styles.progressSubtitle}>{t('analytics.audit_logs_desc', { defaultValue: 'Track all your activity and system events' })}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: AppColors.primary }]}
              onPress={() => router.push({
                pathname: '/(tabs)/analytics/audit-logs',
                params: { returnTo: '/(tabs)/analytics' }
              })}
            >
              <Text style={styles.actionBtnText}>{t('analytics.view_audit_logs', { defaultValue: 'Click to View Audit Logs' })}</Text>
            </TouchableOpacity>
          </View>

          {/* User Progress Card */}
          <View style={[styles.auditLogCard, { borderColor: '#E3F2FD' }]}>
            <View style={styles.progressCardHeader}>
              <View style={styles.progressInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="bar-chart" size={ms(24)} color={AppColors.primary} />
                </View>
                <View style={styles.progressTextBlock}>
                  <Text style={styles.progressTitle}>{t('analytics.user_progress', { defaultValue: 'User Progress Report' })}</Text>
                  <Text style={styles.progressSubtitle}>{t('analytics.user_progress_desc', { defaultValue: 'Detailed tracking of levels, chapters and topics' })}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: AppColors.primary }]}
              onPress={() => router.push({
                pathname: '/(tabs)/analytics/user-progress',
                params: { returnTo: '/(tabs)/analytics' }
              })}
            >
              <Text style={styles.actionBtnText}>{t('analytics.view_user_progress', { defaultValue: 'Click to View Progress' })}</Text>
            </TouchableOpacity>
          </View>

          {/* Certification Report Card */}
          <View style={[styles.auditLogCard, { borderColor: '#F3E5F5' }]}>
            <View style={styles.progressCardHeader}>
              <View style={styles.progressInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="ribbon" size={ms(24)} color="#7B1FA2" />
                </View>
                <View style={styles.progressTextBlock}>
                  <Text style={styles.progressTitle}>{t('analytics.certification_report', { defaultValue: 'Certification Report' })}</Text>
                  <Text style={styles.progressSubtitle}>{t('analytics.certification_report_desc', { defaultValue: 'View and download all your earned certificates' })}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: AppColors.primary }]}
              onPress={() => router.push({
                pathname: '/(tabs)/analytics/certification-report',
                params: { returnTo: '/(tabs)/analytics' }
              })}
            >
              <Text style={styles.actionBtnText}>{t('analytics.view_certifications', { defaultValue: 'Click to View Certificates' })}</Text>
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

  /* ─── Dashboard Header ───────────────────────────── */
  dashboardHeader: {
    paddingHorizontal: wp(20),
    marginTop: hp(24),
    marginBottom: hp(16),
  },
  dashboardTitle: {
    fontSize: fs(22),
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: hp(4),
  },
  dashboardSubtitle: {
    fontSize: fs(13),
    color: AppColors.textSecondary,
    fontWeight: '500',
    lineHeight: fs(18),
  },

  /* ─── Stats Grid ─────────────────────────────────── */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(16),
    justifyContent: 'space-between',
    gap: wp(10),
    marginBottom: hp(20),
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    width: (SCREEN_WIDTH - wp(32) - wp(10)) / 2,
    borderRadius: ms(16),
    padding: wp(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(12),
  },
  gridCardLabel: {
    fontSize: fs(10),
    fontWeight: '700',
    color: AppColors.textSecondary,
    flex: 1,
    marginRight: wp(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridIconBox: {
    width: wp(32),
    height: wp(32),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridNumber: {
    fontSize: fs(22),
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: hp(4),
  },
  gridSubtext: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },

  /* ─── Dashboard Grid Layout ───────────────────── */
  dashboardGrid: {
    paddingHorizontal: wp(16),
    marginTop: hp(10),
  },
  leftColumn: {
    flex: 1,
    marginBottom: hp(12),
  },
  rightColumn: {
    flex: 1,
    marginBottom: hp(12),
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: wp(16),
    marginBottom: hp(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitleSmall: {
    fontSize: fs(12),
    fontWeight: '800',
    color: AppColors.primary,
    marginBottom: hp(16),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* ─── Current Focus ────────────────────────────── */
  focusContent: {
    paddingTop: hp(4),
  },
  focusProgram: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: fs(11),
    fontWeight: '800',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: hp(16),
  },
  focusSteps: {
    marginBottom: hp(20),
  },
  focusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  focusStepLabel: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    width: wp(80),
    marginLeft: wp(8),
  },
  focusStepValue: {
    fontSize: fs(12),
    fontWeight: '600',
    color: AppColors.textDark,
    flex: 1,
  },
  focusStepValueBold: {
    fontSize: fs(14),
    fontWeight: '800',
    color: AppColors.textDark,
    flex: 1,
  },
  focusProgressBox: {
    marginBottom: hp(20),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(6),
  },
  progressLabel: {
    fontSize: fs(11),
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  progressValue: {
    fontSize: fs(11),
    fontWeight: '800',
    color: AppColors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  continueBtn: {
    backgroundColor: AppColors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
    borderRadius: ms(12),
    gap: wp(8),
  },
  continueBtnText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '800',
  },

  /* ─── Quick Stats ──────────────────────────────── */
  quickStatsList: {
    gap: hp(12),
  },
  quickStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  quickStatLabel: {
    fontSize: fs(13),
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  quickStatValue: {
    fontSize: fs(14),
    fontWeight: '800',
    color: AppColors.textDark,
  },

  /* ─── Hierarchy ────────────────────────────────── */
  hierarchyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  hierarchyCount: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  hierarchyList: {
    gap: hp(16),
  },
  moduleItem: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(12),
    backgroundColor: '#fff',
  },
  moduleHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginRight: 10,
  },
  moduleTitle: {
    fontSize: fs(14),
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: hp(4),
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleBarTrack: {
    width: wp(60),
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginRight: 8,
  },
  moduleBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  modulePercent: {
    fontSize: fs(10),
    fontWeight: '700',
    color: AppColors.textSecondary,
    marginRight: 8,
  },
  moduleFraction: {
    fontSize: fs(10),
    fontWeight: '600',
    color: '#94A3B8',
  },
  chaptersList: {
    paddingHorizontal: wp(12),
    paddingBottom: wp(12),
    backgroundColor: '#FCFDFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  chapterIconBox: {
    width: 20,
    alignItems: 'center',
    marginRight: 4,
  },
  chapterTitle: {
    fontSize: fs(12),
    fontWeight: '600',
    color: AppColors.textDark,
    flex: 1,
  },
  chapterPercent: {
    fontSize: fs(11),
    fontWeight: '700',
    color: AppColors.textSecondary,
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
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: wp(16),
    marginBottom: hp(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  auditLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: wp(16),
    marginTop: hp(10),
    marginBottom: hp(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F5E9',
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
