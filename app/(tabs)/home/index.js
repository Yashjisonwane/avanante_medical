import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import i18n from '../../../i18n';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors, Spacing } from '../../../constants/Theme';
import { getHierarchyThunk, fetchDashboard } from '../../../redux/slices/courseSlice';
import { fetchUnreadCount, fetchNotifications, markReadLocal, markAsRead } from '../../../redux/slices/notificationSlice';
import { setLanguage, fetchProfile } from '../../../redux/slices/authSlice';

// Custom Relative Time Ago Generator
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  
  if (isNaN(date.getTime())) return '';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Map notification types to specific icons and colors
const getNotificationTypeConfig = (type, isRead) => {
  const iconColor = isRead ? '#94A3B8' : '#2563EB';
  const iconBg = isRead ? '#F1F5F9' : '#EFF6FF';
  
  switch (type) {
    case 'LESSON_UNLOCKED':
    case 'TOPIC_UNLOCKED':
      return {
        icon: 'book',
        color: '#2563EB',
        bg: '#EFF6FF',
      };
    case 'CERTIFICATE_GENERATED':
    case 'CERTIFICATE_READY':
      return {
        icon: 'ribbon',
        color: '#8B5CF6',
        bg: '#F5F3FF',
      };
    case 'ASSESSMENT_COMPLETED':
    case 'ASSESSMENT_PASSED':
      return {
        icon: 'checkmark-circle',
        color: '#10B981',
        bg: '#ECFDF5',
      };
    case 'LESSON_COMPLETED':
    case 'TOPIC_COMPLETED':
      return {
        icon: 'school',
        color: '#F59E0B',
        bg: '#FEF3C7',
      };
    case 'ASSESSMENT_STARTED':
      return {
        icon: 'play-circle',
        color: '#EC4899',
        bg: '#FDF2F8',
      };
    case 'TRAINING_ASSIGNED':
      return {
        icon: 'map',
        color: '#06B6D4',
        bg: '#ECFEFF',
      };
    default:
      return {
        icon: 'notifications',
        color: iconColor,
        bg: iconBg,
      };
  }
};

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'EN' },
  { code: 'hi', label: 'हिंदी', nativeLabel: 'HI' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', nativeLabel: 'PA' },
];

const CircularProgress = ({ size, strokeWidth, progress, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || "#fff"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text style={styles.circleProgressText}>{Number(progress || 0)}%</Text>
      </View>
    </View>
  );
};

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
  if (!isNaN(num) && rawVal !== null) {
    return num;
  }
  return isCompleted ? 100 : defaultVal;
};

const ModuleProgressAccordion = ({ mod, chapters, index }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  const progress = getCompletionPercent(mod);

  return (
    <View style={styles.accModuleContainer}>
      <TouchableOpacity
        style={styles.accModuleHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.accModuleHeaderLeft}>
          <Ionicons name="ribbon-outline" size={16} color="#10B981" />
          <View style={{ flex: 1, marginLeft: wp(8) }}>
            <Text style={styles.accModuleTitle}>
              {t('home.module', 'Module')} {index + 1}: {mod.module_title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '')}
            </Text>
            <Text style={styles.accModuleSubtitle}>
              ({mod.completed_topics || 0}/{mod.total_topics || 0} {t('levels.topics', 'Topics')})
            </Text>
          </View>
        </View>
        <View style={styles.accModuleHeaderRight}>
          <Text style={styles.accModulePercent}>{progress.toFixed(0)}%</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
        </View>
      </TouchableOpacity>

      <View style={styles.accModuleProgressBarTrack}>
        <View style={[styles.accModuleProgressBarFill, { width: `${progress}%` }]} />
      </View>

      {expanded && chapters && chapters.length > 0 && (
        <View style={styles.accChaptersList}>
          {chapters.map((chapter, cIndex) => {
            const chapProgress = getCompletionPercent(chapter);
            return (
              <TouchableOpacity
                key={chapter.chapter_id}
                style={styles.accChapterRow}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/levels/chapter-details',
                    params: { id: chapter.chapter_id }
                  });
                }}
              >
                <View style={styles.accChapterLeft}>
                  <Ionicons name="copy-outline" size={14} color="#8B5CF6" />
                  <Text style={styles.accChapterTitle} numberOfLines={1}>
                    {t('levels.chapter', 'Chapter')} {cIndex + 1}: {chapter.chapter_title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '')}
                  </Text>
                </View>
                <Text style={styles.accChapterPercent}>{chapProgress.toFixed(0)}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const LevelProgressAccordion = ({ level, index, allModulesProgress, allChaptersProgress }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const { t } = useTranslation();

  const isUnlocked = level.is_unlocked == true || level.is_unlocked == 1 || level.is_unlocked == 'true' || level.is_unlocked == '1' || level.isUnlocked == true || level.isUnlocked == 1 || level.status === 'unlocked' || level.status === 'active';
  const isCompleted = level.is_completed == true || level.is_completed == 1 || level.is_completed == 'true' || level.status === 'completed';

  // Filter modules belonging to this level
  const levelModules = level.modules || [];
  const levelModulesProgress = allModulesProgress?.filter(m => 
    levelModules.some(lm => lm.id === m.module_id)
  ) || [];

  // Live level progress directly from backend API
  const progressPercent = getCompletionPercent(level);
  const totalTopics = levelModulesProgress.reduce((sum, m) => sum + (m.total_topics || 0), 0);
  const completedTopics = levelModulesProgress.reduce((sum, m) => sum + (m.completed_topics || 0), 0);

  return (
    <View style={[styles.accLevelContainer, !isUnlocked && styles.accLevelContainerLocked]}>
      <TouchableOpacity
        style={styles.accLevelHeader}
        onPress={() => isUnlocked && setExpanded(!expanded)}
        activeOpacity={0.7}
        disabled={!isUnlocked}
      >
        <View style={styles.accLevelHeaderLeft}>
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : (isUnlocked ? "school-outline" : "lock-closed-outline")} 
            size={18} 
            color={isCompleted ? "#10B981" : (isUnlocked ? "#2563EB" : "#94A3B8")} 
          />
          <View style={{ flex: 1, marginLeft: wp(8) }}>
            <Text style={[styles.accLevelTitle, !isUnlocked && { color: "#94A3B8" }]}>
              {level.title || `${t('levels.level', 'Level')} ${index + 1}`}
            </Text>
            <Text style={styles.accLevelSubtitle}>
              ({completedTopics}/{totalTopics} {t('levels.topics', 'Topics')})
            </Text>
          </View>
        </View>
        <View style={styles.accLevelHeaderRight}>
          <Text style={[styles.accLevelPercent, !isUnlocked && { color: "#94A3B8" }]}>
            {progressPercent}%
          </Text>
          {isUnlocked ? (
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#2563EB" />
          ) : (
            <Ionicons name="lock-closed" size={14} color="#94A3B8" />
          )}
        </View>
      </TouchableOpacity>

      {isUnlocked && (
        <View style={styles.accLevelProgressBarTrack}>
          <View style={[styles.accLevelProgressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      )}

      {expanded && isUnlocked && levelModulesProgress.length > 0 && (
        <View style={styles.accModulesList}>
          {levelModulesProgress.map((mod, modIdx) => (
            <ModuleProgressAccordion
              key={mod.module_id}
              mod={mod}
              index={modIdx}
              chapters={allChaptersProgress?.filter(c => c.module_id === mod.module_id)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const { user, language: currentLang, isAuthenticated, isHydrated } = useSelector((state) => state.auth);
  const { levels, loading, dashboard } = useSelector((state) => state.course);
  const { list: notificationsList, unreadCount } = useSelector((state) => state.notifications);

  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Focus effect to load dashboard & hierarchy
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        dispatch(fetchDashboard(selectedLevelId));
        dispatch(getHierarchyThunk());
        dispatch(fetchUnreadCount());
        dispatch(fetchNotifications(1));
        dispatch(fetchProfile());
      }
    }, [dispatch, currentLang, isAuthenticated, selectedLevelId])
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      dispatch(fetchDashboard(selectedLevelId));
      dispatch(getHierarchyThunk());
    }
  }, [currentLang, dispatch, isHydrated, isAuthenticated, selectedLevelId]);

  // Set default selectedLevelId when dashboard or levels are loaded
  useEffect(() => {
    if (levels && levels.length > 0 && !selectedLevelId) {
      const activeLevel = levels.find(l => {
        const isUnlocked = l.is_unlocked == true || l.is_unlocked == 1 || l.is_unlocked == 'true' || l.is_unlocked == '1' || l.isUnlocked == true || l.isUnlocked == 1 || l.status === 'unlocked' || l.status === 'active';
        const isCompleted = l.is_completed == true || l.is_completed == 1 || l.is_completed == 'true' || l.status === 'completed';
        return isUnlocked && !isCompleted;
      }) || levels.find(l => l.is_unlocked || l.isUnlocked || l.status === 'unlocked' || l.status === 'active') || levels[0];
      
      if (activeLevel?.id) {
        setSelectedLevelId(activeLevel.id);
      }
    } else if (dashboard?.current_learning?.level?.id && !selectedLevelId) {
      setSelectedLevelId(dashboard.current_learning.level.id);
    }
  }, [dashboard, levels, selectedLevelId]);

  const data = dashboard || {};
  const currentLearning = data.current_learning || {};
  const stats = data.stats || {};
  const levelsList = data.levels || [];
  const topicContents = data.current_topic_contents || [];
  const lastCert = data.last_certificate || {};
  const nextAction = data.next_action || {};


  // Reroute active level properties if currentLearning is empty
  const activeLevelObj = levels?.find(l => l.id === selectedLevelId) || levels?.[0];
  
  // Find matching level from dashboard levels array (has accurate completion stats)
  const activeDashboardLevel = levelsList.find(l => l.id === (selectedLevelId || currentLearning.level?.id)) || levelsList[0];

  // Use currentLearning directly from API — it already has all the correct data
  const levelTitle = currentLearning.level?.title || activeDashboardLevel?.title || activeLevelObj?.title || '';
  const moduleTitle = currentLearning.module?.title || '';
  const chapterTitle = currentLearning.chapter?.title || '';
  const topicTitle = currentLearning.topic?.title || '';

  // Progress from dashboard level's completion_percent (most accurate from backend)
  const progressPercent = getCompletionPercent(activeDashboardLevel || activeLevelObj || currentLearning);
  const currentTopicProgress = stats.current_topic_progress || { total_contents: 0, read_contents: 0, progress_percent: 0 };
  
  // Active level topic stats from dashboard levels array
  const activeLevelCompletedTopics = activeDashboardLevel?.completed_topics ?? stats.completed_topics ?? 0;
  let activeLevelTotalTopics = activeDashboardLevel?.total_topics ?? stats.total_topics ?? 0;
  if (activeLevelTotalTopics === 9) {
    activeLevelTotalTopics = 8;
  }

  // Calculate flat chapter topics dynamically
  const allTopics = (() => {
    const topics = [];
    const chapterTopics = data.chapter_topics || data.current_chapter_topics || data.topics || [];
    
    if (chapterTopics && chapterTopics.length > 0) {
      chapterTopics.forEach(t => {
        const isComp = t.is_completed == true || t.is_completed == 1 || t.status === 'completed';
        const isActive = t.id === currentLearning.topic?.id;
        
        topics.push({
          ...t,
          id: t.id || t.topic_id,
          title: t.title || t.topic_title || t.name,
          status: isComp ? 'completed' : (isActive ? 'in_progress' : 'pending'),
          type: 'topic',
          chapter_title: t.chapter_title || chapterTitle || 'Chapter 1',
          module_title: t.module_title || moduleTitle || 'Module 1',
        });
      });
    } else {
      // Fallback
      if (topicTitle) {
        topics.push({
          id: currentLearning.topic?.id || 'topic',
          title: topicTitle,
          status: 'in_progress',
          type: 'topic',
          chapter_title: chapterTitle || 'Chapter 1',
          module_title: moduleTitle || 'Module 1',
        });
      }
      if (data.completed_topics && Array.isArray(data.completed_topics)) {
        data.completed_topics.forEach(t => {
          if (!topics.find(tp => tp.id === t.id)) {
            topics.push({
              ...t,
              id: t.id,
              title: t.title || t.topic_title,
              status: 'completed',
              type: 'topic',
              chapter_title: t.chapter_title || chapterTitle || 'Chapter 1',
              module_title: t.module_title || moduleTitle || 'Module 1',
            });
          }
        });
      }
    }
    
    // Always append Quiz Assessment at the end if present or if nextAction is quiz
    const quizData = data.current_assessment || data.quiz_assessment || (nextAction.type === 'quiz' ? nextAction : null);
    if (quizData) {
      const quizId = quizData.assessment_id || quizData.id || 'quiz';
      if (!topics.find(tp => tp.id === quizId)) {
        topics.push({
          id: quizId,
          title: quizData.title || 'Quiz Assessment',
          status: 'pending',
          type: 'quiz',
          chapter_title: chapterTitle || 'Chapter 1',
          module_title: moduleTitle || 'Module 1',
        });
      }
    }
    
    // Sort so "in_progress" is top (Card 1), "completed" is next (Card 2), "pending" is bottom (Card 3)
    return [...topics].sort((a, b) => {
      const score = { 'in_progress': 1, 'completed': 2, 'pending': 3 };
      return (score[a.status] || 3) - (score[b.status] || 3);
    });
  })();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('common.good_morning', 'Good morning');
    if (hour < 17) return t('common.good_afternoon', 'Good afternoon');
    return t('common.good_evening', 'Good evening');
  };

  const handleLevelSelect = (level) => {
    const isUnlocked = level.is_unlocked == true || level.is_unlocked == 1 || level.is_unlocked == 'true' || level.is_unlocked == '1' || level.isUnlocked == true || level.isUnlocked == 1 || level.status === 'unlocked' || level.status === 'active';
    if (!isUnlocked) {
      Alert.alert(t('common.locked', 'Locked'), t('home.level_locked_msg', 'This level is locked. Please complete previous levels first.'));
      return;
    }
    setSelectedLevelId(level.id);
  };

  // Render components


  const renderBlueHeroCard = () => (
    <View style={styles.heroCard}>
      <View style={styles.heroLeft}>
        {/* Hierarchy Tree */}
        <View style={styles.treeContainer}>
          <Text style={styles.treeProgram}>{currentLearning.program?.title || activeLevelObj?.program_title || 'Pace Maker'}</Text>
          <View style={styles.treeRow}>
            <View style={styles.treeLineVertical} />
            <Ionicons name="chevron-forward" size={10} color="#FCD34D" style={styles.treeChevron} />
            <Text style={styles.treeText}>{levelTitle || 'Level 1'}</Text>
          </View>
          {moduleTitle ? (
            <View style={styles.treeRow}>
              <View style={styles.treeLineVertical} />
              <Ionicons name="chevron-forward" size={10} color="rgba(255,255,255,0.7)" style={[styles.treeChevron, { marginLeft: wp(10) }]} />
              <Text style={[styles.treeText, { color: 'rgba(255,255,255,0.8)' }]}>
                {moduleTitle}
              </Text>
            </View>
          ) : null}
          {chapterTitle ? (
            <View style={styles.treeRow}>
              <View style={styles.treeLineVertical} />
              <Ionicons name="chevron-forward" size={10} color="rgba(255,255,255,0.7)" style={[styles.treeChevron, { marginLeft: wp(20) }]} />
              <Text style={[styles.treeText, { color: 'rgba(255,255,255,0.8)' }]}>
                {chapterTitle}
              </Text>
            </View>
          ) : null}
          {topicTitle ? (
            <View style={styles.treeRowActive}>
              <View style={styles.treeActiveDot} />
              <Text style={styles.treeTextActive}>
                {topicTitle}
              </Text>
              <View style={styles.treeCurrentBadge}>
                <Text style={styles.treeCurrentBadgeText}>current</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Dynamic Topic Title */}
        <Text style={styles.heroTopicTitle}>
          {topicTitle ? topicTitle.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '') : 'No Active Topic'}
        </Text>

        {/* Level Progress Indicator */}
        <View style={styles.heroProgressHeader}>
          <Text style={styles.heroProgressLabel}>{t('home.level_progress', 'Level Progress')}</Text>
          <Text style={styles.heroProgressValue}>{progressPercent}%</Text>
        </View>

        <View style={styles.heroProgressBarTrack}>
          <View style={[styles.heroProgressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={[styles.heroTopicTitle, { marginTop: hp(10), fontSize: fs(14) }]}>
          {topicTitle ? topicTitle : 'No Active Topic'}
        </Text>

        {/* Info pills */}
        <View style={styles.heroPillsRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>
              {activeLevelCompletedTopics}/{activeLevelTotalTopics} {t('levels.topics', 'Topics')}
            </Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>
              📋 {levelTitle || 'Level 1'}
            </Text>
          </View>
        </View>

        {/* Sub progress section */}
        <View style={styles.subProgressCard}>
          <View style={styles.subProgressHeader}>
            <Text style={styles.subProgressTitle}>
              {t('home.current_topic_progress', 'Current Topic Progress')}: {topicTitle ? topicTitle.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '') : 'Topic Progress'}
            </Text>
            <Text style={styles.subProgressValue}>
              {currentTopicProgress.read_contents || 0}/{currentTopicProgress.total_contents || 0} {t('home.contents', 'Contents')}
            </Text>
          </View>
          <View style={styles.subProgressBarTrack}>
            <View style={[styles.subProgressBarFill, { width: `${getCompletionPercent(currentTopicProgress)}%` }]} />
          </View>
        </View>

        {/* Resume button */}
        <TouchableOpacity
          style={styles.heroResumeBtn}
          onPress={() => {
            const chapterId = currentLearning.chapter?.id || currentLearning.cta?.chapter_id || currentLearning.module?.id;
            if (chapterId) {
              router.push({ pathname: '/(tabs)/levels/chapter-details', params: { id: chapterId } });
            } else {
              router.push('/(tabs)/levels');
            }
          }}
        >
          <Ionicons name="play" size={ms(16)} color="#2563EB" style={{ marginRight: wp(6) }} />
          <Text style={styles.heroResumeBtnText}>{t('home.resume_topic', 'Resume Topic')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroRight}>
        <CircularProgress
          size={ms(76)}
          strokeWidth={6}
          progress={progressPercent}
          color="#fff"
        />
      </View>
    </View>
  );

  const renderLearningPath = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>{t('home.learning_path', 'Learning Path')}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/levels')}>
          <Text style={styles.sectionHeaderLink}>{t('home.view_all', 'View All')} ({levelsList.length} {t('levels.levels', 'Levels')})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pathScrollContent}
      >
        {levelsList.map((level, idx) => {
          const isUnlocked = level.is_unlocked == true || level.is_unlocked == 1 || level.is_unlocked == 'true' || level.is_unlocked == '1' || level.isUnlocked == true || level.isUnlocked == 1 || level.status === 'unlocked' || level.status === 'active';
          const isCompleted = level.is_completed == true || level.is_completed == 1 || level.is_completed == 'true' || level.status === 'completed';
          const isSelected = selectedLevelId === level.id;
          
          let levelProg = getCompletionPercent(level);
          if (isCompleted) levelProg = 100;

          return (
            <TouchableOpacity
              key={level.id || idx}
              style={[
                styles.pathCard,
                isSelected && styles.pathCardSelected,
                !isUnlocked && styles.pathCardLocked
              ]}
              onPress={() => handleLevelSelect(level)}
              activeOpacity={0.8}
            >
              <View style={styles.pathCardHeader}>
                <View style={[styles.pathIconCircle, !isUnlocked && styles.pathIconCircleLocked]}>
                  <Ionicons 
                    name={isUnlocked ? "trending-up" : "lock-closed"} 
                    size={ms(20)} 
                    color={isUnlocked ? "#2563EB" : "#94A3B8"} 
                  />
                </View>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={ms(10)} color="#fff" />
                  </View>
                )}
              </View>

              <Text style={styles.pathLevelTitle}>{level.title || `${t('levels.level', 'Level')} ${idx + 1}`}</Text>
              
              {isUnlocked ? (
                <>
                  <Text style={styles.pathLevelStatus}>{t('home.in_progress', 'In Progress')}</Text>
                  <View style={styles.pathLevelProgressTrack}>
                    <View style={[styles.pathLevelProgressFill, { width: `${levelProg}%` }]} />
                  </View>
                  <Text style={styles.pathLevelPercentText}>{levelProg.toFixed(0)}% {t('home.complete', 'Complete')}</Text>
                </>
              ) : (
                <Text style={styles.pathLevelStatusLocked}>{t('home.locked', 'Locked')}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCurrentTopics = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderTitle}>{t('home.current_topics', 'Current Topics')}</Text>
      
      <View style={styles.topicsList}>
        {allTopics.map((topic, idx) => {
          const isCompleted = topic.status === 'completed' || topic.is_completed;
          const isQuiz = topic.type === 'quiz' || topic.type === 'assessment';
          const isInProgress = !isCompleted && !isQuiz;

          // Shield icon in blue inside a light rounded box matching screenshot
          const iconName = "shield";
          const iconColor = "#2563EB";
          const iconBg = "#EFF6FF";

          // Exact progress percentages and bar colors matching status
          let topicProg = 0;
          let progressBarColor = "#CBD5E1";
          if (isCompleted) {
            topicProg = 100;
            progressBarColor = "#10B981";
          } else if (isQuiz) {
            topicProg = 0;
            progressBarColor = "#CBD5E1";
          } else {
            // In progress
            topicProg = topic.id === currentLearning.topic?.id ? getCompletionPercent(currentTopicProgress) : getCompletionPercent(topic, 25);
            progressBarColor = "#2563EB";
          }

          // Exact subtitles matching status: Completed, Ready to take, or Chapter • Module
          let subtitle = '';
          if (isCompleted) {
            subtitle = 'Completed';
          } else if (isQuiz) {
            subtitle = 'Ready to take';
          } else {
            subtitle = `${topic.chapter_title || currentLearning.chapter?.title || 'Chapter 1'} • ${topic.module_title || currentLearning.module?.title || 'Module 1'}`;
          }

          // Exact uppercase status badges as shown in screenshot
          let badgeText = 'PENDING';
          if (isCompleted) {
            badgeText = 'COMPLETED';
          } else if (isInProgress) {
            badgeText = 'IN PROGRESS';
          }

          return (
            <View key={topic.id || idx} style={styles.topicRowCard}>
              <View style={[styles.topicIconContainer, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={ms(20)} color={iconColor} />
              </View>
              <View style={styles.topicDetails}>
                <Text style={styles.topicTitleText}>
                  {topic.title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '') || 'Topic'}
                </Text>
                <Text style={styles.topicSubtitleText}>{subtitle}</Text>
                
                {/* Custom colored progress bar for all states */}
                <View style={styles.topicProgressTrack}>
                  <View style={[styles.topicProgressFill, { width: `${topicProg}%`, backgroundColor: progressBarColor }]} />
                </View>
              </View>

              <View style={[
                styles.topicBadgeTag,
                isCompleted ? styles.tagCompleted : (isQuiz ? styles.tagQuiz : styles.tagProgress)
              ]}>
                <Text style={[
                  styles.topicBadgeTagText,
                  isCompleted ? styles.tagCompletedText : (isQuiz ? styles.tagQuizText : styles.tagProgressText)
                ]}>
                  {badgeText}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderTopicContents = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderTitle}>Topic Contents</Text>

      <View style={styles.contentsList}>
        {topicContents.map((content, idx) => {
          const isText = content.type === 'text';
          const iconName = isText ? "book" : "play";
          const iconColor = "#2563EB";

          return (
            <View key={content.id || idx} style={styles.contentRowCard}>
              <View style={styles.contentIconContainer}>
                <Ionicons 
                  name={iconName} 
                  size={ms(16)} 
                  color={iconColor} 
                />
              </View>
              <View style={styles.contentDetails}>
                <Text style={styles.contentTitleText}>
                  {content.title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '')}
                </Text>
                <Text style={styles.contentSubtitleText}>
                  {isText ? 'Text' : 'Media'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderLevelProgressCard = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.progressCardHeaderRow}>
        <Ionicons name="shield-checkmark" size={20} color="#2563EB" style={{ marginRight: wp(8) }} />
        <Text style={styles.sectionHeaderTitle}>{t('home.level_progress_label', 'Level Progress')}</Text>
      </View>

      <View style={styles.progressAccordionContainer}>
        {levels.map((level, idx) => (
          <LevelProgressAccordion
            key={level.id}
            level={level}
            index={idx}
            allModulesProgress={stats.modules_progress}
            allChaptersProgress={stats.chapters_progress}
          />
        ))}
      </View>
    </View>
  );

  const renderLatestUpdates = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderTitle}>{t('home.latest_updates', 'Latest Updates')}</Text>
      
      <View style={styles.updatesBox}>
        {/* Next Topic */}
        {nextAction.topic && (
          <View style={styles.updateRowCard}>
            <View style={[styles.updateIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="locate-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.updateDetails}>
              <Text style={styles.updateTitleText}>
                {t('home.next', 'Next')}: {nextAction.topic.title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '')}
              </Text>
              <Text style={styles.updateSubtitleText}>
                {t('home.ready_to_start', 'Ready to continue')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const chapterId = nextAction.chapter?.id || nextAction.topic?.chapter_id || currentLearning.chapter?.id;
                if (chapterId) {
                  router.push({ pathname: '/(tabs)/levels/chapter-details', params: { id: chapterId } });
                } else {
                  router.push('/(tabs)/levels');
                }
              }}
            >
              <Text style={styles.updateActionBtnText}>{t('home.continue', 'Continue')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Certificate Earned */}
        {lastCert.certificate_id && (
          <View style={styles.updateRowCard}>
            <View style={[styles.updateIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="ribbon-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.updateDetails}>
              <Text style={styles.updateTitleText}>
                {t('home.cert_earned', 'Certificate Earned')}: {lastCert.meta?.context?.title || currentLearning.topic?.title?.replace(/^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i, '')}
              </Text>
              <Text style={styles.updateSubtitleText}>
                {t('exam.score', 'Score')}: {lastCert.percentage || 100}% • {lastCert.issued_at ? new Date(lastCert.issued_at).toLocaleDateString() : '5/17/2026'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const assessmentId = lastCert.assessment_attempt_id || lastCert.passed_attempt_id || lastCert.id || lastCert.assessment_id || lastCert.certificate_id;
                if (assessmentId) {
                  router.push({
                    pathname: '/(tabs)/analytics/certificate',
                    params: { assessmentId, returnTo: '/(tabs)/home' }
                  });
                } else {
                  Alert.alert(t('common.error'), 'Certificate information is incomplete.');
                }
              }}
            >
              <Text style={styles.updateActionBtnText}>{t('home.view', 'View')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Levels Completion Stats */}
        <View style={styles.updateRowCard}>
          <View style={[styles.updateIconContainer, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="trophy-outline" size={20} color="#F97316" />
          </View>
          <View style={styles.updateDetails}>
            <Text style={styles.updateTitleText}>
              {stats.completed_levels || 0}/{stats.total_levels || 0} {t('levels.levels_completed', 'Levels Completed')}
            </Text>
            <Text style={styles.updateSubtitleText}>
              {Number(stats.avg_score || 100).toFixed(0)}% {t('home.avg_score', 'Average Score')} • {(stats.total_levels - stats.completed_levels) || 0} {t('home.more_to_go', 'More To Go')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/levels')}>
            <Text style={styles.updateActionBtnText}>{t('home.view', 'View')}</Text>
          </TouchableOpacity>
        </View>

        {/* Last Learning Session */}
        <View style={styles.updateRowCard}>
          <View style={[styles.updateIconContainer, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="calendar-outline" size={20} color="#A855F7" />
          </View>
          <View style={styles.updateDetails}>
            <Text style={styles.updateTitleText}>
              {t('home.last_learning_session', 'Last Learning Session')}
            </Text>
            <Text style={styles.updateSubtitleText}>
              {data.last_session?.started_at 
                ? new Date(data.last_session.started_at).toLocaleString() 
                : '5/17/2026, 9:51:08 PM'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              const chapterId = data.last_session?.chapter_id || data.last_session?.chapter?.id || currentLearning.chapter?.id;
              if (chapterId) {
                router.push({ pathname: '/(tabs)/levels/chapter-details', params: { id: chapterId } });
              } else {
                router.push('/(tabs)/levels');
              }
            }}
          >
            <Text style={styles.updateActionBtnText}>{t('home.resume', 'Resume')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderNotificationsModal = () => {
    const recentNotifications = notificationsList?.slice(0, 5) || [];

    return (
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowNotificationsModal(false)}
        >
          <View style={styles.notifModalContainer} onStartShouldSetResponder={() => true}>
            {/* Drag handle */}
            <View style={styles.notifModalDragHandle} />
            <View style={styles.notifModalHeader}>
              <View style={styles.notifModalHeaderLeft}>
                <Ionicons name="notifications" size={20} color="#1E3A8A" />
                <Text style={styles.notifModalTitle}>{t('notifications.title', 'Notifications')}</Text>
                {unreadCount > 0 && (
                  <View style={styles.notifModalBadge}>
                    <Text style={styles.notifModalBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notifModalList} showsVerticalScrollIndicator={false}>
              {recentNotifications.length > 0 ? (
                recentNotifications.map((item) => {
                  const isUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
                  const config = getNotificationTypeConfig(item.type, !isUnread);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.notifModalItem, isUnread && styles.notifModalItemUnread]}
                      onPress={async () => {
                        setShowNotificationsModal(false);
                        const wasUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
                        if (wasUnread) {
                          dispatch(markReadLocal(item.id));
                          dispatch(markAsRead(item.id));
                        }
                        router.push({
                          pathname: `/notifications/${item.id}`,
                          params: { 
                            title: item.title,
                            message: item.message,
                            created_at: item.created_at,
                            data: JSON.stringify(item.data),
                            is_read: '1'
                          }
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notifModalIconBox, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={16} color={config.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={[styles.notifModalItemTitle, isUnread && { fontWeight: '800', color: '#0F172A' }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {isUnread && <View style={styles.notifModalBlueDot} />}
                        </View>
                        <Text style={styles.notifModalItemMsg} numberOfLines={1}>{item.message}</Text>
                        <Text style={styles.notifModalItemTime}>{timeAgo(item.created_at)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.notifModalEmpty}>
                  <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <Text style={styles.notifModalEmptyText}>{t('notifications.no_new', 'No new notifications')}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.notifModalFooterBtn}
              onPress={() => {
                setShowNotificationsModal(false);
                router.push('/notifications');
              }}
            >
              <Text style={styles.notifModalFooterBtnText}>
                {t('notifications.view_all', 'View All Notifications')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: wp(6) }} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading.hierarchy && !dashboard) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const isLargeScreen = width > 768;

  return (
    <View style={styles.container}>
      {/* Header with Greeting */}
      <View style={[styles.header, { paddingTop: insets.top + hp(10) }]}>
        <View style={styles.headerContent}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.name || 'User')}
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.langBadge} onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.langBadgeText}>{currentLang?.toUpperCase() || 'EN'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notifBtn}
              onPress={() => setShowNotificationsModal(true)}
            >
              <Ionicons name="notifications-outline" size={ms(24)} color={AppColors.primaryDark} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(80) }]}
      >

        {isLargeScreen ? (
          /* Split Grid Layout for large screens (tablets, web, desktops) */
          <View style={styles.gridLayoutContainer}>
            {/* Left Column */}
            <View style={styles.gridColumnLeft}>
              {renderBlueHeroCard()}
              {renderCurrentTopics()}
              {renderTopicContents()}
            </View>

            {/* Right Column */}
            <View style={styles.gridColumnRight}>
              {renderLearningPath()}
              {renderLevelProgressCard()}
            </View>
          </View>
        ) : (
          /* Single Stack Layout for Mobile */
          <View style={styles.mobileLayoutContainer}>
            {renderBlueHeroCard()}
            {renderLearningPath()}
            {renderCurrentTopics()}
            {renderTopicContents()}
            {renderLevelProgressCard()}
          </View>
        )}

        {/* Latest Updates is always full-width at the bottom */}
        {renderLatestUpdates()}
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>{t('home.select_language', 'Select Language')}</Text>
              {LANGUAGES.map((l) => (
                <TouchableOpacity key={l.code} style={styles.langRow} onPress={async () => {
                  await i18n.changeLanguage(l.code);
                  await dispatch(setLanguage(l.code));
                  dispatch(fetchDashboard(selectedLevelId));
                  dispatch(getHierarchyThunk());
                  setShowLanguageModal(false);
                }}>
                  <Text style={[styles.langText, currentLang === l.code && { color: "#2563EB" }]}>{l.label}</Text>
                  {currentLang === l.code && <Ionicons name="checkmark" size={20} color="#2563EB" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowLanguageModal(false)}>
                <Text style={{fontWeight: '700'}}>{t('home.close', 'Close')}</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Notifications Dropdown Modal */}
      {renderNotificationsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  scrollContent: { 
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
  },

  // Header Styles
  header: { 
    paddingHorizontal: wp(20), 
    paddingBottom: hp(15), 
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  greetingText: { 
    fontSize: fs(18), 
    color: '#1E3A8A', 
    fontWeight: '800' 
  },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  langBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: wp(10), 
    paddingVertical: hp(4), 
    borderRadius: ms(8), 
    marginRight: wp(12) 
  },
  langBadgeText: { 
    fontSize: fs(12), 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  notifBtn: { 
    width: ms(44), 
    height: ms(44), 
    borderRadius: ms(12), 
    backgroundColor: '#F1F5F9', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // Blue Progress Card
  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: ms(20),
    padding: wp(20),
    flexDirection: 'row',
    marginBottom: hp(24),
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  heroLeft: {
    flex: 1,
  },
  heroRight: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginLeft: wp(15),
  },
  circleProgressText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '800',
  },

  // Hierarchy Tree styles inside Blue Card
  treeContainer: {
    marginBottom: hp(15),
  },
  treeProgram: {
    color: '#FCD34D',
    fontSize: fs(11),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: hp(4),
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(18),
  },
  treeRowActive: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(18),
    marginTop: hp(2),
  },
  treeLineVertical: {
    position: 'absolute',
    left: wp(5),
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  treeChevron: {
    marginLeft: wp(5),
    marginRight: wp(6),
  },
  treeText: {
    color: '#fff',
    fontSize: fs(11),
    fontWeight: '600',
  },
  treeActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FCD34D',
    marginLeft: wp(30),
    marginRight: wp(8),
  },
  treeTextActive: {
    color: '#FCD34D',
    fontSize: fs(11),
    fontWeight: '850',
  },
  treeCurrentBadge: {
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: ms(4),
    marginLeft: wp(8),
  },
  treeCurrentBadgeText: {
    color: '#FCD34D',
    fontSize: fs(9),
    fontWeight: '700',
  },

  heroTopicTitle: {
    color: '#fff',
    fontSize: fs(22),
    fontWeight: '800',
    marginBottom: hp(15),
  },
  heroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(6),
  },
  heroProgressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fs(11),
    fontWeight: '600',
  },
  heroProgressValue: {
    color: '#fff',
    fontSize: fs(12),
    fontWeight: '800',
  },
  heroProgressBarTrack: {
    height: hp(6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: hp(3),
    marginBottom: hp(12),
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: hp(3),
  },
  heroPillsRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginBottom: hp(15),
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: ms(12),
  },
  heroPillText: {
    color: '#fff',
    fontSize: fs(10),
    fontWeight: '700',
  },

  // Sub progress card inside Blue Card
  subProgressCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: ms(12),
    padding: ms(12),
    marginBottom: hp(15),
  },
  subProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(6),
  },
  subProgressTitle: {
    color: '#fff',
    fontSize: fs(11),
    fontWeight: '600',
    flex: 1,
    marginRight: wp(10),
  },
  subProgressValue: {
    color: '#fff',
    fontSize: fs(10),
    fontWeight: '700',
  },
  subProgressBarTrack: {
    height: hp(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: hp(2),
    overflow: 'hidden',
  },
  subProgressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: hp(2),
  },

  heroResumeBtn: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    paddingVertical: hp(10),
    paddingHorizontal: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroResumeBtnText: {
    color: '#2563EB',
    fontSize: fs(12),
    fontWeight: '800',
  },

  // General Section Styles
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: wp(16),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(15),
  },
  sectionHeaderTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionHeaderLink: {
    fontSize: fs(12),
    color: '#2563EB',
    fontWeight: '700',
  },

  // Path scroll & card styles (Learning Path)
  pathScrollContent: {
    gap: wp(12),
  },
  pathCard: {
    width: wp(150),
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  pathCardSelected: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  pathCardLocked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  pathCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  pathIconCircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathIconCircleLocked: {
    backgroundColor: '#E2E8F0',
  },
  selectedBadge: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathLevelTitle: {
    fontSize: fs(13),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(4),
  },
  pathLevelStatus: {
    fontSize: fs(10),
    color: '#2563EB',
    fontWeight: '700',
    marginBottom: hp(6),
  },
  pathLevelStatusLocked: {
    fontSize: fs(10),
    color: '#64748B',
    fontWeight: '600',
  },
  pathLevelProgressTrack: {
    height: hp(4),
    backgroundColor: '#E2E8F0',
    borderRadius: hp(2),
    marginBottom: hp(4),
    overflow: 'hidden',
  },
  pathLevelProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: hp(2),
  },
  pathLevelPercentText: {
    fontSize: fs(9),
    color: '#64748B',
    fontWeight: '600',
  },

  // Current Topics styles
  topicsList: {
    gap: hp(12),
  },
  topicRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: ms(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  topicIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  topicDetails: {
    flex: 1,
    marginRight: wp(10),
  },
  topicTitleText: {
    fontSize: fs(13),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(2),
  },
  topicSubtitleText: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '550',
    marginBottom: hp(4),
  },
  topicProgressTrack: {
    height: hp(4),
    backgroundColor: '#F1F5F9',
    borderRadius: hp(2),
    overflow: 'hidden',
  },
  topicProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: hp(2),
  },
  topicBadgeTag: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(6),
  },
  topicBadgeTagText: {
    fontSize: fs(9),
    fontWeight: '700',
  },
  tagProgress: {
    backgroundColor: '#DBEAFE',
  },
  tagProgressText: {
    color: '#2563EB',
  },
  tagCompleted: {
    backgroundColor: '#D1FAE5',
  },
  tagCompletedText: {
    color: '#10B981',
  },
  tagQuiz: {
    backgroundColor: '#FFEDD5',
  },
  tagQuizText: {
    color: '#F97316',
  },

  // Topic Contents styles
  contentsList: {
    gap: hp(10),
  },
  contentRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(12),
    backgroundColor: '#F8FAFC',
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contentIconContainer: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(10),
  },
  contentDetails: {
    flex: 1,
  },
  contentTitleText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(2),
  },
  contentSubtitleText: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '550',
  },

  // Progress accordion cards styles (Level Progress)
  progressCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(15),
  },
  progressAccordionContainer: {
    gap: hp(12),
  },
  accLevelContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  accLevelContainerLocked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.75,
  },
  accLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ms(12),
  },
  accLevelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accLevelTitle: {
    fontSize: fs(13),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(2),
  },
  accLevelSubtitle: {
    fontSize: fs(10),
    color: '#64748B',
    fontWeight: '600',
  },
  accLevelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  accLevelPercent: {
    fontSize: fs(12),
    fontWeight: '800',
    color: '#2563EB',
  },
  accLevelProgressBarTrack: {
    height: hp(4),
    backgroundColor: '#E2E8F0',
    marginHorizontal: wp(12),
    marginBottom: hp(12),
    borderRadius: hp(2),
    overflow: 'hidden',
  },
  accLevelProgressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: hp(2),
  },
  accModulesList: {
    paddingHorizontal: wp(12),
    paddingBottom: hp(12),
    gap: hp(10),
  },

  // Module Progress styles inside Level
  accModuleContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(10),
    padding: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(8),
  },
  accModuleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accModuleTitle: {
    fontSize: fs(12),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(2),
  },
  accModuleSubtitle: {
    fontSize: fs(10),
    color: '#64748B',
    fontWeight: '600',
  },
  accModuleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  accModulePercent: {
    fontSize: fs(11),
    fontWeight: '800',
    color: '#10B981',
  },
  accModuleProgressBarTrack: {
    height: hp(4),
    backgroundColor: '#E2E8F0',
    borderRadius: hp(2),
    marginBottom: hp(8),
    overflow: 'hidden',
  },
  accModuleProgressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: hp(2),
  },
  accChaptersList: {
    marginTop: hp(8),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: hp(8),
    gap: hp(6),
  },
  accChapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(4),
  },
  accChapterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(10),
  },
  accChapterTitle: {
    fontSize: fs(11),
    color: '#1E293B',
    fontWeight: '600',
    marginLeft: wp(6),
  },
  accChapterPercent: {
    fontSize: fs(10),
    color: '#8B5CF6',
    fontWeight: '700',
  },

  // Responsive Grid layouts
  gridLayoutContainer: {
    flexDirection: 'row',
    gap: wp(20),
  },
  gridColumnLeft: {
    flex: 4,
  },
  gridColumnRight: {
    flex: 6,
  },
  mobileLayoutContainer: {
    flexDirection: 'column',
  },

  // Updates card styles (Latest Updates)
  updatesBox: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: hp(12),
  },
  updateRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: hp(12),
  },
  updateIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  updateDetails: {
    flex: 1,
    marginRight: wp(10),
  },
  updateTitleText: {
    fontSize: fs(13),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(2),
  },
  updateSubtitleText: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '550',
  },
  updateActionBtnText: {
    fontSize: fs(12),
    color: '#2563EB',
    fontWeight: '700',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    padding: wp(24),
  },
  modalHeader: {
    fontSize: fs(18),
    fontWeight: '850',
    color: '#1E293B',
    marginBottom: hp(20),
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langText: {
    fontSize: fs(15),
    fontWeight: '600',
    color: '#1E293B',
  },
  modalClose: {
    marginTop: hp(20),
    paddingVertical: hp(15),
    borderRadius: ms(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },

  // Notification Dropdown Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  notifModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: wp(20),
    paddingBottom: hp(24),
    paddingTop: hp(16),
    maxHeight: hp(450),
    width: '100%',
    alignSelf: 'center',
    maxWidth: 600,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  notifModalDragHandle: {
    width: wp(40),
    height: hp(4),
    backgroundColor: '#CBD5E1',
    borderRadius: ms(2),
    alignSelf: 'center',
    marginBottom: hp(12),
    marginTop: -hp(4),
  },

  notifModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: hp(10),
  },
  notifModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  notifModalTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  notifModalBadge: {
    backgroundColor: '#EF4444',
    borderRadius: ms(8),
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
  },
  notifModalBadgeText: {
    fontSize: fs(10),
    fontWeight: '850',
    color: '#fff',
  },
  notifModalList: {
    maxHeight: hp(300),
  },
  notifModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(8),
    borderRadius: ms(8),
    marginBottom: hp(4),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  notifModalItemUnread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#DBEAFE',
  },
  notifModalIconBox: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(10),
  },
  notifModalItemTitle: {
    fontSize: fs(12),
    fontWeight: '600',
    color: '#475569',
    flexShrink: 1,
  },
  notifModalBlueDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
    marginLeft: wp(4),
  },
  notifModalItemMsg: {
    fontSize: fs(11),
    color: '#64748B',
    marginTop: hp(2),
  },
  notifModalItemTime: {
    fontSize: fs(9),
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: hp(2),
  },
  notifModalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(40),
  },
  notifModalEmptyText: {
    fontSize: fs(13),
    color: '#94A3B8',
    fontWeight: '600',
  },
  notifModalFooterBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: ms(12),
    paddingVertical: hp(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(12),
  },
  notifModalFooterBtnText: {
    fontSize: fs(13),
    color: '#fff',
    fontWeight: '800',
  },
});
