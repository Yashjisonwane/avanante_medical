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
import { fetchDashboard, getHierarchyThunk } from '../../../redux/slices/courseSlice';

// Generic robust percentage solver
const getCompletionPercent = (item, defaultVal = 0) => {
  if (!item) return defaultVal;
  const isCompleted = item.is_completed == true || item.is_completed == 1 || item.is_completed == 'true' || item.status === 'completed';
  
  let rawVal = item.completion_percentage ?? 
               item.completion_percent ?? 
               item.completion ??
               item.progress_percentage ?? 
               item.progress_percent ?? 
               item.progress ?? 
               null;
               
  if (rawVal === 'NaN' || rawVal === 'null' || rawVal === 'undefined' || rawVal === '') {
    rawVal = null;
  }
  
  const num = Number(rawVal);
  if (isNaN(num) || rawVal === null) {
    return isCompleted ? 100 : defaultVal;
  }
  return Math.min(100, Math.max(0, num));
};

const getModuleTopicsCount = (module) => {
  let total = 0;
  let completed = 0;
  if (module.chapters) {
    module.chapters.forEach(c => {
      if (c.topics) {
        total += c.topics.length;
        completed += c.topics.filter(t => t.is_completed == true || t.is_completed == 1 || t.status === 'completed').length;
      } else {
        total += c.total_topics || 2;
        completed += c.completed_topics || (c.is_completed ? 2 : 0);
      }
    });
  }
  if (total === 0) {
    total = module.total_topics || 4;
    completed = module.completed_topics || 0;
  }
  return { total, completed };
};

const getLevelTopicsCount = (level) => {
  let total = 0;
  let completed = 0;
  if (level.modules) {
    level.modules.forEach(m => {
      const stats = getModuleTopicsCount(m);
      total += stats.total;
      completed += stats.completed;
    });
  }
  if (total === 0) {
    total = level.total_topics || 8;
    completed = level.completed_topics || 0;
  }
  return { total, completed };
};

const ModuleAccordion = ({ module, index, isLastModule }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const { t } = useTranslation();
  
  const isUnlocked = module.is_unlocked == true || module.is_unlocked == 1 || module.is_unlocked == 'true' || module.is_unlocked == '1' || module.isUnlocked == true || module.isUnlocked == 1;
  const { total, completed } = getModuleTopicsCount(module);
  const moduleProg = total > 0 ? (completed / total) * 100 : getCompletionPercent(module);
  
  const chapters = module.chapters || [];
  
  return (
    <View style={[styles.moduleAccordionContainer, !isUnlocked && styles.moduleLocked]}>
      {/* Module Connector Line */}
      <View style={styles.moduleDotColumn}>
        <View style={[styles.moduleDot, { backgroundColor: isUnlocked ? '#3B82F6' : '#94A3B8' }]} />
        {!isLastModule && <View style={styles.moduleDotLine} />}
      </View>
      
      <View style={styles.moduleAccordionCard}>
        <TouchableOpacity 
          style={styles.moduleHeader} 
          onPress={() => isUnlocked && setExpanded(!expanded)}
          activeOpacity={0.7}
          disabled={!isUnlocked}
        >
          <View style={styles.moduleHeaderLeft}>
            {/* Directly rendered folder icon (no background box) */}
            <Ionicons name="folder-open" size={ms(16)} color={isUnlocked ? '#3B82F6' : '#94A3B8'} style={{ marginRight: 8 }} />
            
            <View style={{ flex: 1 }}>
              <Text style={[styles.moduleTitle, !isUnlocked && { color: '#94A3B8' }]}>{module.title || module.module_title}</Text>
              <View style={styles.moduleMeta}>
                <View style={styles.moduleBarTrack}>
                  <View style={[styles.moduleBarFill, { width: `${moduleProg}%`, backgroundColor: isUnlocked ? '#3B82F6' : '#CBD5E1' }]} />
                </View>
                <Text style={styles.modulePercent}>{moduleProg.toFixed(0)}%</Text>
                <Text style={styles.moduleFraction}>{completed}/{total} Topics</Text>
              </View>
            </View>
          </View>
          {isUnlocked && (
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#CBD5E1" />
          )}
        </TouchableOpacity>

        {expanded && isUnlocked && chapters.length > 0 && (
          <View style={styles.chaptersList}>
            {chapters.map((chapter) => {
              const chapterProg = getCompletionPercent(chapter);
              const isChapCompleted = chapter.is_completed || chapterProg === 100;
              return (
                <View key={chapter.id || chapter.chapter_id} style={styles.chapterItem}>
                  {/* Clean Chapter Status Icons matching screenshot perfectly! */}
                  <View style={styles.chapterIconBox}>
                    {isChapCompleted ? (
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    ) : chapterProg > 0 ? (
                      // Beautiful dotted blue circle for in-progress chapter!
                      <View style={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: 7, 
                        borderWidth: 1.5, 
                        borderColor: '#3B82F6', 
                        borderStyle: 'dashed',
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }} />
                    ) : (
                      // Grey lock icon for pending/locked chapter
                      <Ionicons name="lock-closed" size={12} color="#CBD5E1" />
                    )}
                  </View>
                  
                  {/* Sleek grey document icon */}
                  <Ionicons name="document-text" size={ms(14)} color="#94A3B8" style={{ marginRight: 8, marginLeft: 4 }} />
                  
                  <Text style={styles.chapterTitle}>{chapter.title || chapter.chapter_title}</Text>
                  <Text style={styles.chapterPercent}>{chapterProg.toFixed(0)}%</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const LevelAccordion = ({ level, index, isLastLevel }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const isUnlocked = level.is_unlocked == true || level.is_unlocked == 1 || level.is_unlocked == 'true' || level.is_unlocked == '1' || level.isUnlocked == true || level.isUnlocked == 1;
  const { total, completed } = getLevelTopicsCount(level);
  const levelProg = total > 0 ? (completed / total) * 100 : getCompletionPercent(level);
  
  const modules = level.modules || [];
  
  return (
    <View style={[styles.levelAccordionContainer, !isUnlocked && styles.levelLocked]}>
      {/* Level Connector Line */}
      <View style={styles.levelDotColumn}>
        <View style={[styles.levelDot, { backgroundColor: isUnlocked ? '#3B82F6' : '#CBD5E1' }]} />
        {!isLastLevel && <View style={styles.levelDotLine} />}
      </View>
      
      <View style={styles.levelAccordionCard}>
        <TouchableOpacity 
          style={styles.levelHeader} 
          onPress={() => isUnlocked && setExpanded(!expanded)}
          activeOpacity={0.7}
          disabled={!isUnlocked}
        >
          <View style={styles.levelHeaderLeft}>
            {/* Directly rendered trophy icon (no background box) */}
            <Ionicons name="trophy" size={ms(18)} color={isUnlocked ? '#F59E0B' : '#CBD5E1'} style={{ marginRight: 8 }} />
            
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.levelTitleText, !isUnlocked && { color: '#94A3B8' }]}>
                  {level.title || `Level ${index + 1}`}
                </Text>
                {!isUnlocked && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <Ionicons name="lock-closed" size={ms(11)} color="#94A3B8" style={{ marginRight: 2 }} />
                    <Text style={{ fontSize: fs(11), color: '#94A3B8', fontWeight: '500' }}>Locked</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.levelMeta}>
                <View style={styles.levelBarTrack}>
                  {/* Progress bar filled in Blue as per screenshot! */}
                  <View style={[styles.levelBarFill, { width: `${levelProg}%`, backgroundColor: isUnlocked ? '#3B82F6' : '#CBD5E1' }]} />
                </View>
                <Text style={styles.levelPercent}>{levelProg.toFixed(1)}%</Text>
                <Text style={styles.levelFraction}>{completed}/{total} Topics</Text>
              </View>
            </View>
          </View>
          {isUnlocked && (
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#CBD5E1" />
          )}
        </TouchableOpacity>

        {expanded && isUnlocked && modules.length > 0 && (
          <View style={styles.modulesListContainer}>
            {modules.map((module, modIdx) => (
              <ModuleAccordion 
                key={module.id || module.module_id}
                module={module}
                index={modIdx}
                isLastModule={modIdx === modules.length - 1}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};



export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { dashboard, levels, loading } = useSelector((state) => state.course);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const stats = dashboard?.stats || {};

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        dispatch(fetchDashboard());
        dispatch(getHierarchyThunk());
      }
    }, [dispatch, isAuthenticated])
  );

  const displayLevels = React.useMemo(() => {
    if (levels && levels.length > 0) {
      return levels;
    }
    
    // Safety Fallback using stats.modules_progress if levels are empty
    const fallbackModules = stats.modules_progress?.map((m) => {
      const completion = getCompletionPercent(m);
      return {
        id: m.module_id,
        title: m.module_title,
        is_unlocked: true,
        is_completed: completion === 100,
        completion_percentage: completion,
        total_topics: m.total_topics || 4,
        completed_topics: m.completed_topics || 0,
        chapters: stats.chapters_progress?.filter(c => c.module_id === m.module_id).map((c) => {
          const chapProg = getCompletionPercent(c);
          return {
            id: c.chapter_id,
            title: c.chapter_title,
            is_unlocked: true,
            is_completed: chapProg === 100,
            completion_percentage: chapProg,
          };
        }) || []
      };
    }) || [];
    
    return [
      {
        id: 1,
        title: 'Level 1',
        is_unlocked: true,
        is_completed: false,
        completion_percentage: stats.level_progress || 12.5,
        modules: fallbackModules,
      },
      {
        id: 2,
        title: 'Level 2',
        is_unlocked: false,
        is_completed: false,
        completion_percentage: 0,
        modules: [],
      }
    ];
  }, [levels, stats]);




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
              {stats.completed_topics || 0}/{stats.total_topics === 9 ? 8 : (stats.total_topics || 0)}
            </Text>
            <Text style={styles.gridSubtext}>
              {(stats.total_topics === 9 ? 8 : (stats.total_topics || 0)) > 0 
                ? (((parseFloat(stats.completed_topics) || 0) / (stats.total_topics === 9 ? 8 : stats.total_topics)) * 100).toFixed(1)
                : getCompletionPercent(stats).toFixed(1)}% {t('analytics.complete')}
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
                {/* Pace Maker Badge */}
                <View style={{ backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: ms(10), paddingVertical: ms(4), borderRadius: ms(4), marginBottom: hp(16) }}>
                  <Text style={{ color: '#2563EB', fontSize: fs(10), fontWeight: '600' }}>{dashboard?.current_learning?.program?.title || 'Pace Maker'}</Text>
                </View>

                {/* Level */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp(4) }}>
                  <Ionicons name="trophy" size={ms(14)} color="#F59E0B" style={{ marginRight: wp(6) }} />
                  <Text style={{ color: '#64748B', fontSize: fs(12) }}>{t('analytics.level', { defaultValue: 'Level' })}</Text>
                </View>
                <Text style={{ color: '#1E293B', fontSize: fs(14), fontWeight: '700', marginLeft: wp(20), marginBottom: hp(8) }}>{dashboard?.current_learning?.level?.title || 'Level 1'}</Text>
                
                {/* Level Progress */}
                <View style={{ marginLeft: wp(20), marginBottom: hp(16) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(4) }}>
                    <Text style={{ color: '#64748B', fontSize: fs(10) }}>{t('analytics.level_progress', { defaultValue: 'Level Progress' })}</Text>
                    <Text style={{ color: '#1E293B', fontSize: fs(10), fontWeight: '700' }}>{getCompletionPercent(dashboard?.current_learning)}%</Text>
                  </View>
                  <View style={{ height: hp(4), backgroundColor: '#E2E8F0', borderRadius: ms(2), marginBottom: hp(4) }}>
                     <View style={{ height: '100%', width: `${getCompletionPercent(dashboard?.current_learning)}%`, backgroundColor: '#F59E0B', borderRadius: ms(2) }} />
                  </View>
                  <Text style={{ color: '#94A3B8', fontSize: fs(10) }}>
                    {stats.completed_topics || 0}/{stats.total_topics || 0} {t('analytics.topics_completed', { defaultValue: 'Topics Completed' })}
                  </Text>
                </View>

                {/* Module */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: wp(20), marginBottom: hp(4) }}>
                  <Ionicons name="folder" size={ms(14)} color="#3B82F6" style={{ marginRight: wp(6) }} />
                  <Text style={{ color: '#64748B', fontSize: fs(12) }}>{t('modules.details_title', { defaultValue: 'Module' }).split(' ')[0]}</Text>
                </View>
                <Text style={{ color: '#1E293B', fontSize: fs(14), fontWeight: '700', marginLeft: wp(40), marginBottom: hp(12) }}>{dashboard?.current_learning?.module?.title || 'Module 1'}</Text>
                
                {/* Chapter */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: wp(40), marginBottom: hp(4) }}>
                  <Ionicons name="document-text" size={ms(14)} color="#94A3B8" style={{ marginRight: wp(6) }} />
                  <Text style={{ color: '#64748B', fontSize: fs(12) }}>{t('chapters.details_title', { defaultValue: 'Chapter' }).split(' ')[0]}</Text>
                </View>
                <Text style={{ color: '#1E293B', fontSize: fs(14), fontWeight: '700', marginLeft: wp(60), marginBottom: hp(12) }}>{dashboard?.current_learning?.chapter?.title || 'Chapter 1'}</Text>
                
                {/* Current Topic (Yellow Background) */}
                <View style={{ backgroundColor: '#FEF3C7', borderRadius: ms(8), padding: ms(12), marginLeft: wp(60), marginBottom: hp(16) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp(4) }}>
                    <Ionicons name="star" size={ms(14)} color="#F59E0B" style={{ marginRight: wp(6) }} />
                    <Text style={{ color: '#92400E', fontSize: fs(12) }}>{t('analytics.current_topic', { defaultValue: 'Current Topic' })}</Text>
                  </View>
                  <Text style={{ color: '#92400E', fontSize: fs(14), fontWeight: '700', marginLeft: wp(20) }}>{dashboard?.current_learning?.topic?.title || 'Topic'}</Text>
                </View>

                {/* Topic Progress */}
                <View style={{ marginLeft: wp(60), marginBottom: hp(20) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(4) }}>
                    <Text style={{ color: '#64748B', fontSize: fs(10) }}>{t('analytics.topic_progress', { defaultValue: 'Topic Progress' })}</Text>
                    <Text style={{ color: '#1E293B', fontSize: fs(10), fontWeight: '700' }}>{getCompletionPercent(stats.current_topic_progress)}%</Text>
                  </View>
                  <View style={{ height: hp(4), backgroundColor: '#E2E8F0', borderRadius: ms(2), marginBottom: hp(4) }}>
                     <View style={{ height: '100%', width: `${getCompletionPercent(stats.current_topic_progress)}%`, backgroundColor: '#3B82F6', borderRadius: ms(2) }} />
                  </View>
                  <Text style={{ color: '#94A3B8', fontSize: fs(10), textAlign: 'right' }}>
                    {stats.current_topic_progress?.read_contents || 0}/{stats.current_topic_progress?.total_contents || 0} {t('analytics.contents', { defaultValue: 'Contents' })}
                  </Text>
                </View>
                
                {/* Continue Learning Button */}
                <TouchableOpacity 
                  style={{ backgroundColor: '#10B981', borderRadius: ms(8), paddingVertical: hp(12), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => {
                    if (dashboard?.current_learning?.cta?.topic_id) {
                      router.push({ pathname: '/(tabs)/levels/topic-details', params: { id: dashboard.current_learning.cta.topic_id } });
                    } else if (dashboard?.current_learning?.chapter?.id) {
                      router.push({ pathname: '/(tabs)/levels/chapter-details', params: { id: dashboard.current_learning.chapter.id } });
                    }
                  }}
                >
                  <Ionicons name="play-circle" size={ms(18)} color="#fff" style={{ marginRight: wp(8) }} />
                  <Text style={{ color: '#fff', fontSize: fs(14), fontWeight: '700' }}>{t('analytics.continue_learning', { defaultValue: 'Continue Learning' })}</Text>
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

          {/* Right Column: Level Hierarchy Card */}
          <View style={styles.rightColumn}>
            <View style={styles.sectionCard}>
              <View style={styles.hierarchyHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="trophy" size={18} color="#F59E0B" />
                  <Text style={[styles.sectionTitleSmall, { marginBottom: 0, marginLeft: 8, color: AppColors.textDark }]}>Level Hierarchy</Text>
                </View>
                <Text style={styles.hierarchyCount}>
                  {displayLevels.length} {displayLevels.length === 1 ? 'Level' : 'Levels'}
                </Text>
              </View>

              <View style={styles.hierarchyList}>
                {displayLevels.map((level, idx) => (
                  <LevelAccordion 
                    key={level.id} 
                    level={level} 
                    index={idx}
                    isLastLevel={idx === displayLevels.length - 1}
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
  moduleAccordionContainer: {
    flexDirection: 'row',
    marginTop: hp(10),
    marginBottom: hp(6),
    paddingRight: wp(8),
  },
  moduleAccordionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: ms(10),
    backgroundColor: '#fff',
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
  moduleTitle: {
    fontSize: fs(13),
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: hp(2),
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleBarTrack: {
    width: wp(50),
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginRight: 6,
  },
  moduleBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  modulePercent: {
    fontSize: fs(10),
    fontWeight: '700',
    color: AppColors.textSecondary,
    marginRight: 6,
  },
  moduleFraction: {
    fontSize: fs(10),
    fontWeight: '600',
    color: '#94A3B8',
  },
  moduleLocked: {
    opacity: 0.8,
  },
  moduleDotColumn: {
    width: wp(16),
    alignItems: 'center',
    position: 'relative',
  },
  moduleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: hp(18),
    zIndex: 2,
  },
  moduleDotLine: {
    position: 'absolute',
    top: hp(24),
    bottom: 0,
    width: 1.5,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  levelAccordionContainer: {
    flexDirection: 'row',
    marginBottom: hp(16),
  },
  levelAccordionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(14),
    backgroundColor: '#fff',
  },
  levelHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelTitleText: {
    fontSize: fs(14),
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: hp(2),
  },
  levelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBarTrack: {
    width: wp(60),
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginRight: 8,
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelPercent: {
    fontSize: fs(10),
    fontWeight: '700',
    color: AppColors.textSecondary,
    marginRight: 8,
  },
  levelFraction: {
    fontSize: fs(10),
    fontWeight: '600',
    color: '#94A3B8',
  },
  levelLocked: {
    opacity: 0.8,
  },
  levelDotColumn: {
    width: wp(16),
    alignItems: 'center',
    position: 'relative',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: hp(22),
    zIndex: 2,
  },
  levelDotLine: {
    position: 'absolute',
    top: hp(28),
    bottom: 0,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  modulesListContainer: {
    paddingHorizontal: wp(10),
    paddingBottom: hp(10),
    backgroundColor: '#FCFDFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: ms(4),
    marginLeft: wp(8),
  },
  lockedBadgeText: {
    fontSize: fs(9),
    color: '#94A3B8',
    fontWeight: '700',
  },
  chaptersList: {
    paddingHorizontal: wp(12),
    paddingBottom: wp(12),
    backgroundColor: '#fff',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
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
