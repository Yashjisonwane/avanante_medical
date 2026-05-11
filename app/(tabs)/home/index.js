import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  ActivityIndicator,
  Alert,
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
import { fetchUnreadCount } from '../../../redux/slices/notificationSlice';
import { setLanguage, fetchProfile } from '../../../redux/slices/authSlice';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'EN' },
  { code: 'hi', label: 'हिंदी', nativeLabel: 'HI' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', nativeLabel: 'PA' },
];

const ModuleItem = ({ mod, chapters }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  
  return (
    <View style={styles.modItemContainer}>
      <TouchableOpacity 
        style={styles.modHeader} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.modHeaderLeft}>
          <Ionicons name="layers" size={16} color={AppColors.success} />
          <Text style={styles.modTitle}>
            {mod.module_title?.replace('Module', t('home.module', 'Module'))} 
            <Text style={styles.modSubLabel}> ({mod.completed_topics}/{mod.total_topics} {t('levels.topics', 'topics')})</Text>
          </Text>
        </View>
        <View style={styles.modHeaderRight}>
          <Text style={[styles.modValue, { color: AppColors.success }]}>{Number(mod.progress_percent).toFixed(0)}%</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.modProgressContainer}>
        <View style={styles.modBarTrack}>
          <View style={[styles.modBarFill, { width: `${mod.progress_percent}%`, backgroundColor: AppColors.success }]} />
        </View>
      </View>

      {expanded && (
        <View style={styles.chaptersContainer}>
          <View style={styles.chaptersHeader}>
             <Ionicons name="copy" size={14} color="#A855F7" />
             <Text style={styles.chaptersHeaderText}>{t('home.chapters', 'Chapters')}</Text>
          </View>
          {chapters?.map((chapter) => (
            <View key={chapter.chapter_id} style={styles.chapterRow}>
              <View style={styles.chapterLeft}>
                <Ionicons name="copy" size={14} color="#A855F7" />
                <Text style={styles.chapterTitle}>
                  {chapter.chapter_title} 
                  <Text style={styles.chapterSubLabel}> ({chapter.completed_topics}/{chapter.total_topics} {t('levels.topics', 'topics')})</Text>
                </Text>
              </View>
              <Text style={styles.chapterValue}>{Number(chapter.progress_percent).toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const CircularProgress = ({ size, strokeWidth, progress, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
        <Text style={styles.circleProgressText}>{Number(progress).toFixed(1)}%</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { user, language: currentLang } = useSelector((state) => state.auth);
  const { levels, loading, dashboard } = useSelector((state) => state.course);
  const { unreadCount } = useSelector((state) => state.notifications);

  // Data Mapping from Dashboard API
  const data = dashboard || {};
  const currentLearning = data.current_learning || {};
  const stats = data.stats || {};
  const levelsList = data.levels || [];
  const topicContents = data.current_topic_contents || [];
  const lastCert = data.last_certificate || {};
  const nextAction = data.next_action || {};
  
  const progressPercent = currentLearning.progress_percent || 0;
  const currentTopicProgress = stats.current_topic_progress || { total_contents: 0, read_contents: 0, progress_percent: 0 };

  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchDashboard());
      dispatch(getHierarchyThunk());
      dispatch(fetchUnreadCount());
      dispatch(fetchProfile());
    }, [dispatch, currentLang])
  );

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(getHierarchyThunk());
  }, [currentLang, dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('common.good_morning', 'Good morning');
    if (hour < 17) return t('common.good_afternoon', 'Good afternoon');
    return t('common.good_evening', 'Good evening');
  };

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
              onPress={() => router.push('/notifications')}
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
        contentContainerStyle={{ paddingBottom: hp(100) }}
      >
        {/* Blue Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroBadge}>
              {currentLearning.program?.title} • {currentLearning.level?.title}
            </Text>
            <Text style={styles.heroModuleTitle}>{currentLearning.module?.title?.replace('Module', t('home.module', 'Module'))}</Text>
            <Text style={styles.heroTopicTitle}>{t('home.current_topic_label', 'Current Topic')}: {currentLearning.topic?.title?.replace('Topic', t('levels.topic', 'Topic'))}</Text>
            
            <View style={styles.heroProgressBarContainer}>
              <View style={[styles.heroProgressBar, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>{Number(progressPercent).toFixed(1)}% {t('analytics.complete', 'Complete')}</Text>
            
            <View style={styles.topicBadge}>
               <Ionicons name="bookmark" size={ms(12)} color="#fff" />
               <Text style={styles.topicBadgeText}>{currentLearning.chapter?.title}</Text>
            </View>

            <View style={styles.subProgressSection}>
               <Text style={styles.subProgressTitle}>{t('home.current_topic_progress', 'Current Topic Progress')}</Text>
               <View style={styles.subProgressBarContainer}>
                 <View style={[styles.subProgressBar, { width: `${currentTopicProgress.progress_percent}%` }]} />
               </View>
               <Text style={styles.subProgressText}>
                 {currentTopicProgress.read_contents}/{currentTopicProgress.total_contents} {t('home.contents_read', 'Contents Read')}
               </Text>
            </View>

            <TouchableOpacity 
              style={styles.resumeBtn}
              onPress={() => {
                const chapterId = currentLearning.chapter?.id || currentLearning.cta?.chapter_id || currentLearning.module?.id;
                if (chapterId) {
                  router.push({ pathname: '/(tabs)/levels/chapter-details', params: { id: chapterId } });
                }
              }}
            >
              <Ionicons name="play" size={ms(16)} color={AppColors.primary} />
              <Text style={styles.resumeBtnText}>{t('home.resume_lesson', 'Resume Lesson')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.heroRight}>
            <CircularProgress 
              size={ms(70)} 
              strokeWidth={5} 
              progress={progressPercent} 
              color="#fff" 
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.learning_path', 'Learning Path')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pathScroll} contentContainerStyle={{ paddingRight: wp(20) }}>
           {levelsList.map((level, idx) => (
             <TouchableOpacity 
               key={idx} 
               style={[
                 styles.pathCard, 
                 level.status === 'locked' && styles.pathCardLocked
               ]}
               activeOpacity={0.8}
             >
               <View style={styles.pathStepBadge}>
                 <Text style={styles.pathStepText}>{t('home.step', 'STEP')} {idx + 1}</Text>
               </View>
               <View style={[
                 styles.pathIconBox,
                 level.status === 'locked' && { backgroundColor: '#F1F5F9' }
               ]}>
                 <Ionicons 
                   name={level.status === 'unlocked' ? "checkmark-circle" : "lock-closed"} 
                   size={ms(24)} 
                   color={level.status === 'unlocked' ? AppColors.primary : '#94A3B8'} 
                 />
               </View>
               <Text style={styles.pathCardTitle}>{level.title}</Text>
               <Text style={[
                 styles.pathCardStatus,
                 level.status === 'locked' && { color: '#94A3B8' }
               ]}>
                 {level.status === 'unlocked' ? t('home.active', 'Active') : t('home.locked', 'Locked')}
               </Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.current_topics', 'Current Topics')}</Text>
        </View>
        <View style={styles.topicsContainer}>
          <View style={styles.topicCard}>
            <View style={styles.topicIconCircle}>
              <Ionicons name="shield" size={ms(20)} color={AppColors.primary} />
            </View>
            <View style={styles.topicBody}>
              <Text style={styles.topicName}>{currentLearning.topic?.title}</Text>
              <Text style={styles.topicDesc}>{currentLearning.chapter?.title} • {currentLearning.module?.title}</Text>
              <View style={styles.topicProgressBarTrack}>
                <View style={[styles.topicProgressBarFill, { width: `${currentTopicProgress.progress_percent || 0}%` }]} />
              </View>
            </View>
            <View style={[styles.statusTag, styles.tagProgress]}>
              <Text style={styles.tagProgressText}>{t('home.in_progress', 'IN PROGRESS')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.topic_contents', 'Topic Contents')}</Text>
        </View>
        <View style={styles.contentsContainer}>
          {topicContents.map((content, idx) => (
            <View key={idx} style={styles.contentCard}>
              <View style={styles.contentIconBox}>
                <Ionicons 
                  name={content.type === 'text' ? "book" : "play"} 
                  size={ms(18)} 
                  color={AppColors.primary} 
                />
              </View>
              <View style={styles.contentBody}>
                <Text style={styles.contentName}>{content.title}</Text>
                <Text style={styles.contentType}>{content.type === 'text' ? t('levels.text_topic', 'Text') : t('levels.media_topic', 'Media')}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sideSection}>
           <View style={styles.sideCard}>
              <View style={styles.sideCardHeader}>
                 <Ionicons name="shield" size={ms(16)} color={AppColors.primary} />
                 <Text style={styles.sideCardTitle}>{t('home.level_progress', 'Level Progress')}</Text>
              </View>
              <View style={styles.sideProgressContent}>
                <View style={styles.sideProgressRow}>
                   <Text style={styles.sideLabel}>
                     {currentLearning.level?.title} 
                     <Text style={styles.sideSubLabel}> ({stats.completed_topics || 0}/{stats.total_topics || 0} {t('levels.topics', 'topics')})</Text>
                   </Text>
                   <Text style={styles.sideValue}>{Number(progressPercent).toFixed(1)}%</Text>
                </View>
                <View style={styles.sideBarTrack}><View style={[styles.sideBarFill, {width: `${progressPercent}%`}]} /></View>
              </View>
           </View>

           <View style={[styles.sideCard, {marginTop: hp(15)}]}>
              <View style={styles.sideCardHeader}>
                 <Ionicons name="layers" size={ms(16)} color={AppColors.success} />
                 <Text style={styles.sideCardTitle}>{t('home.module_chapter_hierarchy', 'Module & Chapter Progress')}</Text>
              </View>
              
              <View style={styles.accordionContainer}>
                {stats.modules_progress?.map((mod) => (
                  <ModuleItem 
                    key={mod.module_id} 
                    mod={mod} 
                    chapters={stats.chapters_progress?.filter(c => c.module_id === mod.module_id)} 
                  />
                ))}
              </View>
           </View>
        </View>

         {/* Latest Updates */}
         <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{t('home.latest_updates', 'Latest Updates')}</Text>
         </View>
         <View style={styles.updatesBox}>
           {nextAction.topic && (
             <View style={styles.updateItem}>
                <View style={[styles.upIcon, {backgroundColor: '#EFF6FF'}]}><Ionicons name="locate-outline" size={20} color={AppColors.primary} /></View>
                <View style={{flex: 1}}>
                   <Text style={styles.upTitle}>{t('home.next', 'Next')}: {nextAction.topic.title}</Text>
                   <Text style={styles.upSub}>{nextAction.type === 'quiz' ? t('home.quiz', 'Quiz') : t('levels.topic', 'Topic')} • {t('home.ready_to_start', 'Ready to start')}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    // Try to find chapter ID in multiple possible locations in the nextAction object
                    const chapterId = 
                      nextAction.chapter?.id || 
                      nextAction.topic?.chapter_id || 
                      nextAction.assessment?.chapter_id ||
                      nextAction.cta?.chapter_id ||
                      currentLearning.chapter?.id; // Final fallback to current learning

                    if (chapterId) {
                      router.push({ pathname: '/(tabs)/levels/chapter-details', params: { id: chapterId } });
                    } else {
                      router.push('/(tabs)/levels');
                    }
                  }}
                >
                  <Text style={styles.upAction}>{t('home.continue', 'Continue')}</Text>
                </TouchableOpacity>
             </View>
           )}
           {lastCert.certificate_id && (
             <View style={styles.updateItem}>
                <View style={[styles.upIcon, {backgroundColor: '#DCFCE7'}]}><Ionicons name="ribbon" size={20} color={AppColors.success} /></View>
                <View style={{flex: 1}}>
                   <Text style={styles.upTitle}>{t('home.cert_earned', 'Certificate earned')}: {lastCert.meta?.context?.title}</Text>
                   <Text style={styles.upSub}>{t('exam.score', 'Score')}: {lastCert.percentage}% • {new Date(lastCert.issued_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    // Align with analytics report logic: use passed_attempt_id or id
                    // Restore full list of fallbacks to ensure we get a valid ID
                    // Prioritize assessment_attempt_id or passed_attempt_id for the API
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
                  <Text style={styles.upAction}>{t('home.view', 'View')}</Text>
                </TouchableOpacity>
             </View>
           )}
           <View style={styles.updateItem}>
              <View style={[styles.upIcon, {backgroundColor: '#FFEDD5'}]}><Ionicons name="school" size={20} color="#F97316" /></View>
              <View style={{flex: 1}}>
                 <Text style={styles.upTitle}>{stats.completed_levels || 0}/{stats.total_levels || 0} {t('analytics.levels', 'levels')} {t('home.completed', 'completed')}</Text>
                 <Text style={styles.upSub}>{(stats.total_levels - stats.completed_levels) || 0} {t('exam.remaining', 'remaining')}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/levels')}>
                <Text style={styles.upAction}>{t('home.view', 'View')}</Text>
              </TouchableOpacity>
           </View>
           <View style={styles.updateItem}>
              <View style={[styles.upIcon, {backgroundColor: '#F3E8FF'}]}><Ionicons name="calendar" size={20} color="#A855F7" /></View>
              <View style={{flex: 1}}>
                 <Text style={styles.upTitle}>{t('home.last_session', 'Last Learning Session')}</Text>
                 <Text style={styles.upSub}>
                   {data.last_session?.started_at 
                     ? new Date(data.last_session.started_at).toLocaleString() 
                     : t('home.no_recent_sessions', 'No recent sessions')}
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
                <Text style={styles.upAction}>{t('home.resume', 'Resume')}</Text>
              </TouchableOpacity>
           </View>
         </View>

         {/* Achievement Banner */}
         <TouchableOpacity style={styles.achievementBanner}>
            <View style={styles.achieveIconBox}>
               <Ionicons name="medal" size={20} color="#B45309" />
            </View>
            <View style={{flex: 1}}>
               <Text style={styles.achieveTitle}>{t('home.achievement_unlocked', 'Achievement Unlocked')}</Text>
               <Text style={styles.achieveSub}>{t('home.cert_earned_msg', { count: stats.total_certificates || 0, score: stats.avg_score || 0 })}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B45309" />
         </TouchableOpacity>
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
                  dispatch(fetchDashboard());
                  dispatch(getHierarchyThunk());
                  setShowLanguageModal(false);
                }}>
                  <Text style={[styles.langText, currentLang === l.code && { color: AppColors.primary }]}>{l.label}</Text>
                  {currentLang === l.code && <Ionicons name="checkmark" size={20} color={AppColors.primary} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowLanguageModal(false)}>
                <Text style={{fontWeight: '700'}}>{t('home.close', 'Close')}</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: wp(20), paddingBottom: hp(15), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { fontSize: fs(18), color: AppColors.primaryDark, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: ms(8), marginRight: wp(12) },
  langBadgeText: { fontSize: fs(12), fontWeight: '800', color: AppColors.textDark },
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
  
  heroCard: { margin: wp(20), backgroundColor: AppColors.primary, borderRadius: ms(20), padding: wp(20), flexDirection: 'row', elevation: 10, shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  heroLeft: { flex: 2 },
  heroBadge: { color: '#FCD34D', fontSize: fs(11), fontWeight: '900', marginBottom: hp(6) },
  heroModuleTitle: { color: '#fff', fontSize: fs(24), fontWeight: '800', marginBottom: hp(2) },
  heroTopicTitle: { color: 'rgba(255,255,255,0.9)', fontSize: fs(14), fontWeight: '600', marginBottom: hp(15) },
  heroProgressBarContainer: { height: hp(5), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, marginBottom: hp(4) },
  heroProgressBar: { height: '100%', backgroundColor: '#fff', borderRadius: 10 },
  heroProgressText: { color: '#fff', fontSize: fs(11), fontWeight: '700', textAlign: 'right' },
  topicBadge: { backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: 6, flexDirection: 'row', alignItems: 'center', marginTop: hp(15) },
  topicBadgeText: { color: '#fff', fontSize: fs(11), fontWeight: '700', marginLeft: wp(6) },
  
  subProgressSection: { marginTop: hp(20), backgroundColor: 'rgba(255,255,255,0.1)', padding: wp(12), borderRadius: 12, marginBottom: hp(15) },
  subProgressTitle: { color: '#fff', fontSize: fs(12), fontWeight: '600', marginBottom: hp(8) },
  subProgressBarContainer: { height: hp(4), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, marginBottom: hp(4) },
  subProgressBar: { height: '100%', backgroundColor: '#60A5FA', borderRadius: 10 },
  subProgressText: { color: 'rgba(255,255,255,0.8)', fontSize: fs(10), fontWeight: '700', textAlign: 'right' },
  
  resumeBtn: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp(12), borderRadius: ms(25), marginTop: hp(10), width: wp(160) },
  resumeBtnText: { color: AppColors.primary, fontSize: fs(15), fontWeight: '800', marginLeft: wp(8) },
  heroRight: { flex: 0.8, alignItems: 'flex-end', justifyContent: 'flex-start' },
  circleProgressText: { color: '#fff', fontSize: fs(14), fontWeight: '900' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp(20), marginTop: hp(20), marginBottom: hp(12) },
  sectionTitle: { fontSize: fs(18), fontWeight: '800', color: AppColors.primaryDark },
  viewAllBtn: { fontSize: fs(13), color: AppColors.primary, fontWeight: '700' },
  
  pathScroll: { paddingLeft: wp(20), marginBottom: hp(10) },
  pathCard: { backgroundColor: '#fff', width: wp(150), padding: wp(16), borderRadius: ms(20), marginRight: wp(15), borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, alignItems: 'center' },
  pathCardLocked: { backgroundColor: '#F8FAFC', opacity: 0.8 },
  pathStepBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: wp(8), paddingVertical: hp(2), borderRadius: 6, alignSelf: 'center', marginBottom: hp(10) },
  pathStepText: { fontSize: fs(9), fontWeight: '900', color: AppColors.primary, letterSpacing: 0.5 },
  pathIconBox: { width: ms(48), height: ms(48), borderRadius: ms(16), backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: hp(12) },
  pathCardTitle: { fontSize: fs(15), fontWeight: '800', color: AppColors.textDark, textAlign: 'center' },
  pathCardStatus: { fontSize: fs(11), color: AppColors.primary, fontWeight: '700', marginTop: hp(4), textAlign: 'center' },
  
  topicsContainer: { paddingHorizontal: wp(20) },
  topicCard: { backgroundColor: '#fff', borderRadius: ms(12), padding: wp(16), marginBottom: hp(12), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  topicIconCircle: { width: ms(48), height: ms(48), borderRadius: ms(10), backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: wp(16) },
  topicBody: { flex: 1, marginRight: wp(10) },
  topicName: { fontSize: fs(15), fontWeight: '700', color: AppColors.textDark },
  topicDesc: { fontSize: fs(12), color: AppColors.textSecondary, marginTop: hp(2) },
  topicProgressBarTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginTop: hp(12), width: '80%' },
  topicProgressBarFill: { height: '100%', backgroundColor: AppColors.primary, borderRadius: 2 },
  statusTag: { paddingHorizontal: wp(12), paddingVertical: hp(6), borderRadius: ms(8) },
  tagProgress: { backgroundColor: '#EFF6FF' },
  tagProgressText: { color: AppColors.primary, fontSize: fs(10), fontWeight: '800', textTransform: 'uppercase' },
  
  contentsContainer: { paddingHorizontal: wp(20), gap: hp(10) },
  contentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: wp(12), borderRadius: ms(12), borderWidth: 1, borderColor: '#F1F5F9' },
  contentIconBox: { width: ms(40), height: ms(40), borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: wp(12), borderWidth: 1, borderColor: '#F1F5F9' },
  contentBody: { flex: 1 },
  contentName: { fontSize: fs(14), fontWeight: '700', color: AppColors.textDark },
  contentType: { fontSize: fs(12), color: AppColors.textSecondary, marginTop: hp(2) },
  
  sideSection: { paddingHorizontal: wp(20), marginTop: hp(25) },
  sideCard: { backgroundColor: '#fff', borderRadius: 12, padding: wp(16), borderWidth: 1, borderColor: '#F1F5F9' },
  sideCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(16), borderBottomWidth: 1, borderBottomColor: '#F8FAFC', paddingBottom: hp(10) },
  sideCardTitle: { fontSize: fs(15), fontWeight: '700', color: AppColors.primaryDark, marginLeft: wp(8) },
  sideProgressContent: { paddingHorizontal: wp(4) },
  sideProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(10) },
  sideLabel: { fontSize: fs(14), fontWeight: '700', color: AppColors.textDark },
  sideSubLabel: { fontSize: fs(11), fontWeight: '500', color: '#94A3B8' },
  sideValue: { fontSize: fs(13), fontWeight: '800', color: AppColors.primary },
  sideBarTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 10 },
  sideBarFill: { height: '100%', backgroundColor: AppColors.primary, borderRadius: 10 },

  accordionContainer: { gap: hp(12) },
  modItemContainer: { backgroundColor: '#F8FAFC', borderRadius: ms(10), padding: wp(12), borderWidth: 1, borderColor: '#F1F5F9' },
  modHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modTitle: { fontSize: fs(14), fontWeight: '700', color: AppColors.textDark, marginLeft: wp(8) },
  modSubLabel: { fontSize: fs(10), fontWeight: '500', color: '#94A3B8' },
  modHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: wp(8) },
  modValue: { fontSize: fs(13), fontWeight: '800' },
  modProgressContainer: { marginTop: hp(10) },
  modBarTrack: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 10 },
  modBarFill: { height: '100%', borderRadius: 10 },

  chaptersContainer: { marginTop: hp(16), paddingLeft: wp(10), borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: hp(12) },
  chaptersHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(10) },
  chaptersHeaderText: { fontSize: fs(12), fontWeight: '700', color: AppColors.textDark, marginLeft: wp(6) },
  chapterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: hp(8), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  chapterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chapterTitle: { fontSize: fs(12), fontWeight: '600', color: AppColors.textDark, marginLeft: wp(8) },
  chapterSubLabel: { fontSize: fs(10), color: '#94A3B8' },
  chapterValue: { fontSize: fs(11), fontWeight: '700', color: '#A855F7' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: wp(24) },
  modalHeader: { fontSize: fs(18), fontWeight: '800', marginBottom: hp(20), textAlign: 'center' },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hp(18), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  langText: { fontSize: fs(16), fontWeight: '600' },
  modalClose: { marginTop: hp(20), alignItems: 'center', paddingVertical: hp(15), backgroundColor: '#F8FAFC', borderRadius: 12 },

  /* ─── Latest Updates & Banner ─── */
  updatesBox: { paddingHorizontal: wp(16), paddingBottom: hp(10), backgroundColor: '#fff', marginHorizontal: wp(20), borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  updateItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(16), borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  upIcon: { width: ms(44), height: ms(44), borderRadius: ms(22), alignItems: 'center', justifyContent: 'center', marginRight: wp(16) },
  upTitle: { fontSize: fs(14), fontWeight: '700', color: AppColors.textDark },
  upSub: { fontSize: fs(11), color: '#94A3B8', marginTop: hp(2) },
  upAction: { fontSize: fs(13), fontWeight: '700', color: AppColors.primary, paddingLeft: wp(10) },

  achievementBanner: { backgroundColor: '#FFFBEB', margin: wp(20), padding: wp(16), borderRadius: 12, borderWeight: 1, borderColor: '#FEF3C7', flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  achieveIconBox: { width: ms(40), height: ms(40), borderRadius: ms(20), backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: wp(12) },
  achieveTitle: { fontSize: fs(13), fontWeight: '800', color: '#B45309' },
  achieveSub: { fontSize: fs(11), color: '#D97706', marginTop: hp(2) },
});
