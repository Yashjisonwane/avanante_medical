import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';

const TopicCard = ({
  image,
  title,
  units,
  progress,
  status,
  locked = false,
  requirement,
  onPress
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.cardHeader}>
        <Image source={image} style={styles.topicImage} />
        <View style={styles.topicInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.topicTitle} numberOfLines={2}>{title}</Text>
            {!locked && status === 'Completed' && (
              <Ionicons name="checkmark-circle" size={ms(24)} color="#17B8A6" />
            )}
            {!locked && <Ionicons name="chevron-forward" size={ms(20)} color="#CCC" style={{ marginLeft: wp(5) }} />}
          </View>
          <Text style={styles.unitsText}>{t('chapters.learning_units', { count: units })}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {status === 'Completed' ? t('chapters.completed') : (locked ? t('chapters.locked') : t('chapters.current_progress'))}
          </Text>
          <Text style={[styles.progressPercentage, status === 'Completed' && { color: '#17B8A6' }]}>
            {progress}%
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: status === 'Completed' ? '#17B8A6' : (locked ? '#EEE' : '#FF6B00')
              }
            ]}
          />
        </View>
      </View>

      {!locked ? (
        status === 'Completed' ? (
          <View style={styles.completedActions}>
            <TouchableOpacity style={styles.quizButton} onPress={onPress}>
              <Text style={styles.quizButtonText}>{t('chapters.attempt_quiz')}</Text>
            </TouchableOpacity>
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.actionPill}>
                <Ionicons name="refresh" size={ms(18)} color="#24458B" />
                <Text style={styles.actionPillText}>{t('chapters.replay')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionPill}>
                <Ionicons name="bar-chart" size={ms(18)} color="#24458B" />
                <Text style={styles.actionPillText}>{t('chapters.performance')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.resumeButton} onPress={onPress}>
            <Text style={styles.resumeButtonText}>{t('chapters.resume_topic')}</Text>
            <Ionicons name="play-circle" size={ms(24)} color="#fff" />
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.lockedFooter}>
          <Text style={styles.requirementText}>{t('chapters.requirement', { level: requirement })}</Text>
          <Ionicons name="lock-closed" size={ms(18)} color="#999" />
        </View>
      )}
    </View>
  );
};

export default function SubtopicListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>{t('chapters.chapter_label')}</Text>
            <Text style={styles.headerTitle}>{t('chapters.topics_title')}</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={ms(24)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(120) }}
      >
        <View style={styles.subHeader}>
          <Text style={styles.topicsCount}>{t('chapters.topics_in_module', { count: 3 })}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{t('chapters.level_n', { number: 2 })}</Text>
          </View>
        </View>

        <TopicCard
          image={require('../../../assets/subtitle-1.png')}
          title={t('chapters.t1_title')}
          units={6}
          progress={100}
          status="Completed"
          onPress={() => router.push('/(tabs)/levels/topic-details')}
        />

        <TopicCard
          image={require('../../../assets/subtitle-2.png')}
          title={t('chapters.t2_title')}
          units={4}
          progress={50}
          status="Running"
          onPress={() => router.push('/(tabs)/levels/topic-details')}
        />

        <TopicCard
          image={require('../../../assets/my-level-3.png')}
          title={t('chapters.p_ecg_trace')}
          units={8}
          progress={0}
          status="Locked"
          locked={true}
          requirement={3}
        />

        <TopicCard
          image={require('../../../assets/level-detail-1.png')}
          title={t('chapters.p_ecg_trace')}
          units={8}
          progress={0}
          status="Locked"
          locked={true}
          requirement={3}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: AppColors.primaryDark,
    paddingBottom: hp(20),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(20),
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: wp(40),
    height: wp(40),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: fs(10),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: hp(2),
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: '700',
    color: AppColors.textWhite,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(20),
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp(20),
  },
  topicsCount: {
    fontSize: fs(15),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  levelBadge: {
    backgroundColor: AppColors.badgeTealBg,
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: ms(20),
  },
  levelBadgeText: {
    color: AppColors.teal,
    fontSize: fs(12),
    fontWeight: '700',
  },
  card: {
    backgroundColor: AppColors.backgroundWhite,
    borderRadius: ms(20),
    padding: wp(16),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardLocked: {
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  topicImage: {
    width: wp(60),
    height: wp(60),
    borderRadius: ms(12),
    marginRight: wp(15),
  },
  topicInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  topicTitle: {
    fontSize: fs(17),
    fontWeight: '800',
    color: AppColors.textDark,
    flex: 1,
  },
  unitsText: {
    fontSize: fs(13),
    color: AppColors.placeholder,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: hp(20),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(8),
  },
  progressLabel: {
    fontSize: fs(10),
    fontWeight: '800',
    color: AppColors.placeholder,
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: fs(12),
    fontWeight: '700',
    color: AppColors.textDark,
  },
  progressBarTrack: {
    height: hp(8),
    backgroundColor: '#F0F2F5',
    borderRadius: ms(4),
  },
  progressBar: {
    height: '100%',
    borderRadius: ms(4)
  },
  resumeButton: {
    height: hp(55),
    backgroundColor: AppColors.primary,
    borderRadius: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(10),
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: fs(16),
    fontWeight: '800',
  },
  completedActions: {
    gap: hp(12),
  },
  quizButton: {
    height: hp(55),
    backgroundColor: AppColors.teal,
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizButtonText: {
    color: '#fff',
    fontSize: fs(16),
    fontWeight: '800',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: wp(12),
  },
  actionPill: {
    flex: 1,
    height: hp(50),
    backgroundColor: '#F0F7FF',
    borderRadius: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
  },
  actionPillText: {
    color: AppColors.primaryDark,
    fontSize: fs(13),
    fontWeight: '700',
  },
  lockedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(10),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  requirementText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#999',
  },
});
