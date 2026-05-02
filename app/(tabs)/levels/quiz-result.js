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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { submitAssessmentFeedback } from '../../../redux/slices/courseSlice';

export default function QuizResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { result, details } = useSelector((state) => state.course.assessment);
  
  // Get IDs from params or Redux state
  const assessment_id = params.assessment_id || details?.assessment_id || result?.assessment_id;
  const attempt_id = params.attempt_id || result?.attempt_id || result?.id;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
 
  const score = result?.percentage || result?.score || 0;
  const total = result?.total || 5;
  const correct = result?.correct || 0;
  const wrong = result?.wrong || 0;
  const skipped = result?.skipped || 0;
  const status = result?.status || 'failed';
  const timeTakenSec = result?.time_taken_seconds || 0;
  const timeTakenMin = result?.time_taken_minutes || 0;

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
      await dispatch(submitAssessmentFeedback({
        assessmentId: assessment_id,
        payload: {
          attempt_id: attempt_id,
          rating: rating,
          review: review
        }
      })).unwrap();
      setFeedbackSubmitted(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
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

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + hp(10), paddingBottom: hp(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerRow}>
           <View style={styles.headerIconWrapper}>
              <View style={styles.headerIconCircle}>
                 <Ionicons name="close" size={ms(24)} color="#fff" />
              </View>
           </View>
            <View>
              <Text style={styles.headerTitle}>{t('exam.quiz_finished', 'Quiz Finished')}</Text>
              <Text style={styles.headerSubtitle}>{t('exam.review_summary', 'Review your performance summary below')}</Text>
            </View>
        </View>

        {/* Score Header Card */}
        <View style={styles.scoreCard}>
           <Text style={styles.bgScoreText}>{score}</Text>
           <View style={styles.scoreCircleContainer}>
               <View style={styles.scoreCircle}>
                  <Text style={styles.scoreValueText}>{score}%</Text>
                  <Text style={styles.scoreLabelText}>{t('exam.score', 'SCORE')}</Text>
               </View>
           </View>
                      <Text style={styles.statusTitle}>
              {score >= 50 ? t('exam.great_job', 'Great Job!') : t('exam.keep_practicing', 'Keep Practicing')}
            </Text>
            <Text style={styles.statusMessage}>
              {score >= 50 ? t('exam.passed_msg', 'You have passed the assessment') : t('exam.failed_msg', "Don't give up, review and try again")}
            </Text>

           <View style={[styles.statusBadge, { backgroundColor: score >= 50 ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons 
                name={score >= 50 ? "trophy" : "ribbon"} 
                size={ms(12)} 
                color={score >= 50 ? "#16A34A" : "#E11D48"} 
              />
               <Text style={[styles.statusBadgeText, { color: score >= 50 ? "#16A34A" : "#E11D48" }]}>
                 {status.toUpperCase()} • {t('exam.score', 'SCORE')}: {correct} / {total}
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

        {/* Feedback Section */}
        <View style={styles.feedbackCard}>
            <View style={styles.cardHeader}>
               <Ionicons name="chatbubble-ellipses-outline" size={ms(18)} color="#1E293B" />
               <Text style={styles.cardTitle}>{t('exam.share_experience', 'Share Your Experience')}</Text>
            </View>

           {feedbackSubmitted ? (
             <View style={styles.thanksContainer}>
                 <View style={styles.thanksIconCircle}>
                    <Ionicons name="heart" size={ms(30)} color="#EF4444" />
                 </View>
                 <Text style={styles.thanksTitle}>{t('common.thank_you', 'Thank you!')}</Text>
                 <Text style={styles.thanksMessage}>{t('exam.feedback_thanks', 'Your feedback helps us improve.')}</Text>
              </View>
            ) : (
              <View style={styles.feedbackForm}>
                 <Text style={styles.feedbackLabel}>{t('exam.rate_quiz', 'How would you rate this quiz?')}</Text>
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
              onPress={() => router.replace('/(tabs)/home')}
            >
               <Text style={styles.homeBtnText}>{t('common.back_to_home', 'Back to Home')}</Text>
            </TouchableOpacity>

         <TouchableOpacity 
           style={styles.retryBtn}
           onPress={() => router.replace({
             pathname: '/(tabs)/levels/exam',
              params: { id: assessment_id }
            })}
          >
             <Text style={styles.retryBtnText}>{t('exam.retry', 'Try Again')}</Text>
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
  },
  scoreCircle: {
    width: ms(130),
    height: ms(130),
    borderRadius: ms(65),
    borderWidth: 10,
    borderColor: '#FFE4E6',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreValueText: {
    fontSize: fs(28),
    fontWeight: '800',
    color: '#1E293B',
  },
  scoreLabelText: {
    fontSize: fs(10),
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
    borderRadius: ms(20),
    padding: ms(20),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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
  starsRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(25),
    justifyContent: 'center',
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
    paddingVertical: hp(25),
  },
  thanksIconCircle: {
    width: ms(70),
    height: ms(70),
    borderRadius: ms(35),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(15),
  },
  thanksTitle: {
    fontSize: fs(20),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(8),
  },
  thanksMessage: {
    fontSize: fs(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(22),
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
