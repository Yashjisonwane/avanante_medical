import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { submitAssessmentFeedback, resetAssessment } from '../../../redux/slices/courseSlice';

export default function QuizResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { result, details } = useSelector((state) => state.course.assessment);
  
  // Get IDs from params or Redux state
  const assessment_id = params.assessment_id || result?.assessment_id || details?.assessment_id;
  const attempt_id = params.attempt_id || result?.attempt_id;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
 
  const score = Number(result?.percentage || result?.score || 0);
  const total = result?.total || 0;
  const correct = result?.correct || 0;
  const wrong = result?.wrong || 0;
  const skipped = result?.skipped || 0;
  const status = result?.status || (score >= 50 ? 'passed' : 'failed');
  const timeTakenSec = result?.time_taken_seconds || 0;
  const timeTakenMin = result?.time_taken_minutes || 0;

  if (!result && !params.attempt_id) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: hp(15), color: '#64748B' }}>{t('exam.preparing', 'Loading results...')}</Text>
      </View>
    );
  }

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmittingFeedback(true);

    if (!assessment_id || !attempt_id) {
      Alert.alert('Error', 'Session information missing. Cannot submit feedback.');
      setIsSubmittingFeedback(false);
      return;
    }

    try {
      const feedbackResult = await dispatch(submitAssessmentFeedback({
        assessmentId: assessment_id,
        payload: {
          attempt_id: attempt_id,
          assessment_id: assessment_id,
          rating: rating,
          review: review || '',
          comment: review || '',
          feedback: review || ''
        }
      })).unwrap();
      setFeedbackSubmitted(true);
      Alert.alert(t('common.success', 'Success'), feedbackResult?.message || 'Feedback submitted successfully!');
    } catch (e) {
      console.log('Feedback Error:', e);
      const errorMsg = e?.message || e?.error || 'Failed to submit feedback. Please try again.';
      Alert.alert(t('common.error', 'Error'), errorMsg);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const formatTime = () => {
    if (timeTakenMin > 0) {
      const mins = Math.floor(timeTakenMin);
      const secs = Math.round((timeTakenMin % 1) * 60);
      return `${mins}m ${secs}s`;
    }
    const mins = Math.floor(timeTakenSec / 60);
    const secs = Math.round(timeTakenSec % 60);
    return `${mins}m ${secs}s`;
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return 'Excellent';
      case 4: return 'Very Good';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + hp(10), paddingBottom: hp(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerRow}>
           <View style={styles.headerIconWrapper}>
              <View style={[styles.headerIconCircle, { backgroundColor: score >= 50 ? '#10B981' : '#E11D48', shadowColor: score >= 50 ? '#10B981' : '#E11D48' }]}>
                 <Ionicons name={score >= 50 ? "checkmark" : "close"} size={ms(24)} color="#fff" />
              </View>
           </View>
            <View>
              <Text style={styles.headerTitle}>{t('exam.quiz_finished', 'Quiz Finished')}</Text>
              <Text style={styles.headerSubtitle}>{t('exam.review_summary', 'Review your performance summary below')}</Text>
            </View>
        </View>

        {/* Score Header Card */}
        <View style={[styles.scoreCard, { backgroundColor: score >= 50 ? '#F0FDF4' : '#FFF1F2', borderColor: score >= 50 ? '#DCFCE7' : '#FFE4E6' }]}>
           <Text style={styles.bgScoreText}>{score}</Text>
           <View style={styles.scoreCircleContainer}>
               <View style={styles.scoreCircleWrapper}>
                  <Svg width={ms(150)} height={ms(150)} viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={score >= 50 ? '#DCFCE7' : '#FFE4E6'}
                      strokeWidth="8"
                      fill="#FFFFFF"
                    />
                    {/* Progress Circle */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={score >= 50 ? '#10B981' : '#EF4444'}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </Svg>
                  <View style={styles.scoreTextOverlay}>
                      <Text style={styles.scoreValueText}>{score}%</Text>
                      <Text style={styles.scoreLabelText}>{t('exam.score', 'SCORE')}</Text>
                  </View>
               </View>
           </View>
                      <Text style={[styles.statusTitle, { color: score >= 50 ? '#166534' : '#881337' }]}>
              {score >= 50 ? t('exam.great_job', 'Great Job!') : t('exam.keep_practicing', 'Keep Practicing')}
            </Text>
            <Text style={[styles.statusMessage, { color: score >= 50 ? '#15803D' : '#E11D48' }]}>
              {score >= 50 ? t('exam.passed_msg', 'You have passed the assessment') : t('exam.failed_msg', "Don't give up, review and try again")}
            </Text>

           <View style={[styles.statusBadge, { backgroundColor: score >= 50 ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons 
                name={score >= 50 ? "trophy" : "ribbon"} 
                size={ms(12)} 
                color={score >= 50 ? "#16A34A" : "#E11D48"} 
              />
               <Text style={[styles.statusBadgeText, { color: score >= 50 ? "#16A34A" : "#E11D48" }]}>
                 {String(status || '').toUpperCase()} • {t('exam.score', 'SCORE')}: {correct} / {total}
               </Text>
           </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
                 <Ionicons name="checkmark-circle-outline" size={ms(16)} color="#10B981" />
               </View>
               <Text style={styles.statValue}>{correct}</Text>
               <Text style={styles.statLabel}>{t('exam.correct', 'CORRECT')}</Text>
            </View>

           <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#FEF2F2' }]}>
                 <Ionicons name="close-circle-outline" size={ms(16)} color="#EF4444" />
               </View>
               <Text style={styles.statValue}>{wrong}</Text>
               <Text style={styles.statLabel}>{t('exam.incorrect', 'INCORRECT')}</Text>
            </View>

           <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F8FAFC' }]}>
                 <Ionicons name="timer-outline" size={ms(16)} color="#64748B" />
               </View>
               <Text style={styles.statValue}>{skipped}</Text>
               <Text style={styles.statLabel}>{t('exam.skipped', 'SKIPPED')}</Text>
            </View>

           <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#EFF6FF' }]}>
                 <Ionicons name="trending-up-outline" size={ms(16)} color="#3B82F6" />
               </View>
               <Text style={styles.statValue}>{formatTime()}</Text>
               <Text style={styles.statLabel}>{t('exam.time_spent', 'TIME SPENT')}</Text>
            </View>
        </View>
 
        {/* Detailed Performance Analysis Section */}
        <View style={styles.analysisCard}>
          <View style={styles.cardHeader}>
             <Ionicons name="stats-chart" size={ms(18)} color="#1E293B" />
             <Text style={styles.cardTitle}>{t('exam.performance_analysis', 'Detailed Performance Analysis')}</Text>
          </View>
          
          <View style={styles.analysisRow}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="hash-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.attempt_id', 'Attempt ID')}</Text>
            </View>
            <Text style={styles.analysisValue}>#{attempt_id}</Text>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="book-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.total_questions', 'Total Questions')}</Text>
            </View>
            <Text style={styles.analysisValue}>{total}</Text>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="locate-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.questions_attempted', 'Questions Attempted')}</Text>
            </View>
            <Text style={styles.analysisValue}>{correct + wrong}</Text>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="time-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.pending_questions', 'Pending Questions')}</Text>
            </View>
            <Text style={styles.analysisValue}>{Math.max(0, total - (correct + wrong))}</Text>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="refresh-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.attempts_used', 'Attempts Used')}</Text>
            </View>
            <Text style={styles.analysisValue}>{details?.attempts_count || 1} / {details?.attempts_limit || 1}</Text>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="ribbon-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.attempts_remaining', 'Attempts Remaining')}</Text>
            </View>
            <Text style={[styles.analysisValue, { color: '#F59E0B' }]}>{(details?.attempts_limit || 0) - (details?.attempts_count || 0)}</Text>
          </View>

          <View style={[styles.analysisRow, { borderBottomWidth: 0 }]}>
            <View style={styles.analysisLabelContainer}>
              <Ionicons name="timer-outline" size={ms(14)} color="#64748B" />
              <Text style={styles.analysisLabel}>{t('exam.total_duration', 'Total Duration')}</Text>
            </View>
            <Text style={styles.analysisValue}>{result?.time_taken_minutes || (result?.time_taken_seconds ? (result.time_taken_seconds / 60).toFixed(2) : '0.00')} minutes</Text>
          </View>
        </View>

        {/* Feedback Section */}
        <View style={[styles.feedbackCard, feedbackSubmitted && styles.feedbackCardSubmitted]}>
            {!feedbackSubmitted && (
              <View style={styles.cardHeader}>
                 <Ionicons name="chatbubble-ellipses-outline" size={ms(18)} color="#1E293B" />
                 <Text style={styles.cardTitle}>{t('exam.share_experience', 'Share Your Experience')}</Text>
              </View>
            )}

            {feedbackSubmitted ? (
              <View style={styles.thanksContainer}>
                  <View style={styles.thanksIconCircle}>
                     <Ionicons name="checkmark" size={ms(32)} color="#fff" />
                  </View>
                  <Text style={styles.thanksTitle}>Thank You for Your Feedback!</Text>
                  <Text style={styles.thanksMessage}>Your input helps us improve and create better learning experiences.</Text>
                  
                  <View style={styles.thanksStarsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                       <Ionicons 
                         key={s}
                         name={s <= rating ? "star" : "star-outline"} 
                         size={ms(20)} 
                         color="#F59E0B" 
                         style={{ marginHorizontal: 2 }}
                       />
                    ))}
                  </View>

                  <Text style={styles.redirectText}>Redirecting to dashboard in a moment...</Text>
               </View>
            ) : (
              <View style={styles.feedbackForm}>
                 <Text style={styles.feedbackLabel}>{t('exam.rate_quiz', 'How would you rate this quiz?')}</Text>
                  <View style={styles.starsContainer}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                           <Ionicons 
                             name={s <= rating ? "star" : "star-outline"} 
                             size={ms(30)} 
                             color={s <= rating ? "#F59E0B" : "#CBD5E1"} 
                           />
                        </TouchableOpacity>
                      ))}
                    </View>
                    {rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingBadgeText}>{getRatingLabel(rating)}</Text>
                      </View>
                    )}
                  </View>

                 <TextInput
                   style={styles.commentInput}
                   placeholder={t('exam.comment_placeholder', 'Additional comments (optional)...')}
                   placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={review}
                  onChangeText={setReview}
                  textAlignVertical="top"
                />

                <TouchableOpacity 
                  style={[styles.submitFeedbackBtn, isSubmittingFeedback && { opacity: 0.7 }]}
                  onPress={handleFeedbackSubmit}
                  disabled={isSubmittingFeedback}
                >
                  {isSubmittingFeedback ? (
                    <ActivityIndicator color="#fff" size="small" />
                   ) : (
                     <>
                       <Ionicons name="paper-plane" size={ms(16)} color="#fff" />
                       <Text style={styles.submitFeedbackText}>{t('exam.submit_feedback', 'Submit Feedback')}</Text>
                     </>
                   )}
                </TouchableOpacity>
             </View>
           )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, hp(15)) }]}>
            <TouchableOpacity 
              style={styles.homeBtn}
              onPress={() => {
                dispatch(resetAssessment());
                router.replace('/(tabs)/home');
              }}
            >
               <Text style={styles.homeBtnText}>{t('common.home', 'Home')}</Text>
            </TouchableOpacity>

         <TouchableOpacity 
           style={styles.retryBtn}
           onPress={() => router.replace('/(tabs)/levels')}
          >
             <Text style={styles.retryBtnText}>{t('common.my_levels', 'My Levels')}</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: wp(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(25),
    marginTop: hp(10),
  },
  headerIconWrapper: {
    marginRight: wp(15),
  },
  headerIconCircle: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(12),
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#1E3A8A',
  },
  headerSubtitle: {
    fontSize: fs(13),
    color: '#64748B',
    fontWeight: '500',
    marginTop: hp(2),
  },
  scoreCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: ms(24),
    paddingVertical: hp(40),
    alignItems: 'center',
    marginBottom: hp(25),
    borderWidth: 1,
    borderColor: '#FFE4E6',
    position: 'relative',
    overflow: 'hidden',
  },
  bgScoreText: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    fontSize: fs(120),
    fontWeight: '900',
    color: '#000',
    opacity: 0.02,
  },
  scoreCircleContainer: {
    marginBottom: hp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleWrapper: {
    width: ms(150),
    height: ms(150),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scoreTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValueText: {
    fontSize: fs(32),
    fontWeight: '800',
    color: '#1E293B',
  },
  scoreLabelText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  statusTitle: {
    fontSize: fs(26),
    fontWeight: '800',
    color: '#881337',
    marginBottom: hp(6),
  },
  statusMessage: {
    fontSize: fs(14),
    color: '#E11D48',
    fontWeight: '500',
    marginBottom: hp(25),
    textAlign: 'center',
    paddingHorizontal: wp(20),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
    borderRadius: ms(20),
  },
  statusBadgeText: {
    fontSize: fs(11),
    fontWeight: '700',
    marginLeft: wp(8),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(30),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: hp(20),
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  statValue: {
    fontSize: fs(17),
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: fs(9),
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(15),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(15),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  analysisLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: fs(13),
    color: '#64748B',
    fontWeight: '500',
    marginLeft: wp(10),
  },
  analysisValue: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#1E293B',
  },
  feedbackCardSubmitted: {
    backgroundColor: '#E1F8ED',
    borderColor: '#A7F3D0',
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(20),
    paddingBottom: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cardTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: wp(12),
  },
  feedbackForm: {
    marginTop: hp(5),
  },
  feedbackLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#475569',
    marginBottom: hp(15),
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(25),
    gap: wp(15),
  },
  starsRow: {
    flexDirection: 'row',
    gap: wp(8),
  },
  ratingBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: wp(12),
    paddingVertical: hp(4),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  ratingBadgeText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#D97706',
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(15),
    padding: ms(15),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: hp(100),
    color: '#1E293B',
    fontSize: fs(14),
    marginBottom: hp(25),
  },
  submitFeedbackBtn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    height: hp(55),
    borderRadius: ms(15),
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(10),
  },
  submitFeedbackText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '700',
  },
  thanksContainer: {
    alignItems: 'center',
    paddingVertical: hp(40),
    paddingHorizontal: wp(20),
  },
  thanksIconCircle: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(18),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  thanksTitle: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: hp(12),
    textAlign: 'center',
  },
  thanksMessage: {
    fontSize: fs(14),
    color: '#065F46',
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: hp(20),
    fontWeight: '500',
  },
  thanksStarsRow: {
    flexDirection: 'row',
    marginBottom: hp(15),
  },
  redirectText: {
    fontSize: fs(12),
    color: '#059669',
    fontWeight: '600',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
    gap: wp(15),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  homeBtn: {
    flex: 1,
    height: hp(52),
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#475569',
  },
  retryBtn: {
    flex: 1,
    height: hp(52),
    borderRadius: ms(14),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
});
