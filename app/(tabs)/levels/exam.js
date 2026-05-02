import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import {
  startAssessment,
  fetchAssessmentQuestions,
  answerAssessmentQuestion,
  submitAssessment,
  resumeAssessment,
  updateQuestionAnswer
} from '../../../redux/slices/courseSlice';

const OptionItem = ({ index, text, selected, onPress }) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
        {selected ? (
          <Ionicons name="checkmark" size={ms(16)} color="#3B82F6" />
        ) : null}
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {letters[index]}. {text}
      </Text>
    </TouchableOpacity>
  );
};

export default function ExamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: assessment_id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { assessment, loading } = useSelector((state) => state.course);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initExam = async () => {
      if (assessment_id) {
        setInitError(null);
        let attemptId = null;
        try {
          // Try to resume first
          const resumeResult = await dispatch(resumeAssessment(assessment_id)).unwrap();
          attemptId = resumeResult?.data?.attempt_id || resumeResult?.attempt_id;
        } catch (e) {
          console.log("Resume failed:", e);
        }

        if (!attemptId) {
          try {
            // If no active attempt, start new
            const startResult = await dispatch(startAssessment(assessment_id)).unwrap();
            attemptId = startResult?.data?.attempt_id || startResult?.attempt_id;
          } catch (e) {
            console.log("Start failed:", e);
            setInitError(e.message || "Failed to start quiz. It may not be available or max attempts reached.");
          }
        }

        if (attemptId) {
          try {
            await dispatch(fetchAssessmentQuestions({ assessmentId: assessment_id, attemptId })).unwrap();
          } catch (e) {
            console.log("Fetch questions failed:", e);
            setInitError(e.message || "Failed to load quiz questions.");
          }
        }
      } else {
        setInitError("Invalid Quiz ID");
      }
    };
    initExam();
  }, [dispatch, assessment_id]);

  useEffect(() => {
    // Handle hardware back button
    const backAction = () => {
      setShowLeaveModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    let interval;
    // Timer logic
    if (assessment.details?.expires_at && !isSubmitted) {
      const expiresAt = new Date(assessment.details.expires_at).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = expiresAt - now;
        if (diff <= 0) {
          setTimeLeft("00:00");
          setShowTimeExpiredModal(true);
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assessment.details?.expires_at, isSubmitted]);

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOptionId(currentQuestion.selected_option_id);
    }
  }, [currentQuestion]);

  const handleAnswer = async (optionId) => {
    // If clicking the same option, allow deselecting (setting to null)
    const newOptionId = selectedOptionId === optionId ? null : optionId;

    // 1. Update local UI state immediately for instant feedback
    setSelectedOptionId(newOptionId);
    
    // 2. Update Redux store so the answer persists when navigating prev/next
    dispatch(updateQuestionAnswer({ 
      questionId: currentQuestion.id, 
      optionId: newOptionId 
    }));

    // 3. Sync with backend
    if (assessment.currentAttemptId) {
      try {
        await dispatch(answerAssessmentQuestion({
          attempt_id: assessment.currentAttemptId,
          question_id: currentQuestion.id,
          selected_option_id: newOptionId
        })).unwrap();
      } catch (e) {
        console.error("Failed to sync answer with server", e);
        // Optional: Revert local state on failure if critical
      }
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      t('exam.submit', 'Submit'),
      t('exam.confirm_submit', 'Are you sure you want to submit?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.confirm', 'Submit'),
          onPress: async () => {
            if (assessment.currentAttemptId) {
              setIsSubmitted(true);
              await dispatch(submitAssessment({
                assessmentId: assessment_id,
                attemptId: assessment.currentAttemptId
              }));
              router.push({
                pathname: '/(tabs)/levels/quiz-result',
                params: { 
                  assessment_id: assessment_id,
                  attempt_id: assessment.currentAttemptId
                }
              });
            }
          }
        },
      ]
    );
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit(); // If it's the last question, Next could be Submit
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = async () => {
    if (assessment.currentAttemptId) {
      setSelectedOptionId(null);
      dispatch(updateQuestionAnswer({ questionId: currentQuestion.id, optionId: null }));
      await dispatch(answerAssessmentQuestion({
        attempt_id: assessment.currentAttemptId,
        question_id: currentQuestion.id,
        selected_option_id: null
      }));
      handleNext();
    }
  };

  if (initError) {
    return (
      <View style={[styles.loaderContainer, { padding: wp(20) }]}>
        <Ionicons name="alert-circle-outline" size={ms(50)} color="#E11D48" />
        <Text style={[styles.noQuestionsText, { color: '#E11D48', marginTop: hp(10), textAlign: 'center' }]}>
          {initError}
        </Text>
        <TouchableOpacity 
          style={[styles.leaveCancelBtn, { marginTop: hp(20), width: '80%', alignSelf: 'center' }]}
          onPress={() => router.back()}
        >
          <Text style={styles.leaveCancelBtnText}>{t('common.go_back', 'Go Back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading.assessmentAction && !questions.length) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.noQuestionsText}>{t('exam.preparing', 'Preparing your quiz...')}</Text>
        <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: hp(10) }} />
      </View>
    );
  }

  const isAnswerSelected = selectedOptionId !== null && selectedOptionId !== undefined;
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Leave Quiz Confirmation Modal */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.leaveModalContent}>
            <TouchableOpacity 
              style={styles.closeModalX} 
              onPress={() => setShowLeaveModal(false)}
            >
              <Ionicons name="close" size={ms(20)} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.warningIconContainer}>
              <View style={styles.warningIconCircle}>
                <Ionicons name="warning-outline" size={ms(30)} color="#F97316" />
              </View>
            </View>

            <Text style={styles.leaveModalTitle}>{t('exam.leave_quiz_q', 'Leave Quiz?')}</Text>
            <Text style={styles.leaveModalMessage}>
              {t('exam.leave_message', 'You have an ongoing quiz. If you leave now, your quiz will be auto-submitted.')}
            </Text>
            <Text style={styles.leaveModalHighlight}>{t('exam.progress_saved', 'Your progress will be saved.')}</Text>

            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>
                {t('exam.time_remaining', 'Time remaining')}: <Text style={styles.timerBadgeValue}>{timeLeft || '--:--'}</Text>
              </Text>
            </View>

            <View style={styles.leaveModalActions}>
              <TouchableOpacity 
                style={styles.leaveCancelBtn} 
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={styles.leaveCancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.leaveSubmitBtn} 
                onPress={async () => {
                  setShowLeaveModal(false);
                  setIsSubmitted(true);
                  if (assessment.currentAttemptId) {
                    await dispatch(submitAssessment({
                      assessmentId: assessment_id,
                      attemptId: assessment.currentAttemptId
                    }));
                    router.push({
                      pathname: '/(tabs)/levels/quiz-result',
                      params: { 
                        assessment_id: assessment_id,
                        attempt_id: assessment.currentAttemptId
                      }
                    });
                  } else {
                    router.back();
                  }
                }}
              >
                <Text style={styles.leaveSubmitBtnText}>{t('exam.leave_submit', 'Leave & Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Time Expired Modal */}
      <Modal visible={showTimeExpiredModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.leaveModalContent}>
            <View style={[styles.warningIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="time-outline" size={ms(35)} color="#E11D48" />
            </View>
            <Text style={styles.leaveModalTitle}>{t('exam.time_expired', 'Time Expired!')}</Text>
            <Text style={styles.leaveModalMessage}>
              {t('exam.time_expired_message', 'Your time for this assessment has ended. Your answers will be submitted automatically.')}
            </Text>
            
            <View style={[styles.leaveModalActions, { marginTop: hp(20) }]}>
              <TouchableOpacity 
                style={styles.leaveCancelBtn} 
                onPress={() => {
                  setShowTimeExpiredModal(false);
                  router.back();
                }}
              >
                <Text style={styles.leaveCancelBtnText}>{t('exam.exit', 'Exit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.leaveSubmitBtn} 
                onPress={async () => {
                  setShowTimeExpiredModal(false);
                  setIsSubmitted(true);
                  if (assessment.currentAttemptId) {
                    await dispatch(submitAssessment({
                      assessmentId: assessment_id,
                      attemptId: assessment.currentAttemptId
                    }));
                    router.push({
                      pathname: '/(tabs)/levels/quiz-result',
                      params: { 
                        assessment_id: assessment_id,
                        attempt_id: assessment.currentAttemptId
                      }
                    });
                  } else {
                    router.back();
                  }
                }}
              >
                <Text style={styles.leaveSubmitBtnText}>{t('exam.leave_submit', 'Leave & Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Topic Details Card Header */}
      <View style={[styles.detailsCard, { marginTop: insets.top + hp(10) }]}>
        <View style={styles.detailsHeader}>
          <View style={styles.detailsTitleContainer}>
            <TouchableOpacity 
              style={styles.backBtnSmall}
              onPress={() => setShowLeaveModal(true)}
            >
               <Ionicons name="chevron-back" size={ms(20)} color="#3B82F6" />
            </TouchableOpacity>
            <View style={styles.topicIconBg}>
               <Ionicons name="book-outline" size={ms(18)} color="#3B82F6" />
            </View>
            <Text style={styles.detailsTitle}>{t('levels.topic_details', 'Topic Details')}</Text>
          </View>
          <View style={styles.attemptsInfo}>
            {timeLeft && (
              <View style={styles.countdownContainer}>
                <Ionicons name="timer-outline" size={ms(14)} color="#E11D48" />
                <Text style={styles.countdownText}>{timeLeft}</Text>
              </View>
            )}
            <Text style={styles.attemptsLabel}>
              {t('exam.attempts', 'Attempts')}: <Text style={styles.attemptsValue}>{assessment.details?.attempts_count || 0} / {assessment.details?.attempts_limit || 0}</Text>
            </Text>
            <Text style={styles.remainingLabel}>
              {t('exam.remaining', 'Remaining')}: <Text style={styles.remainingValue}>{(assessment.details?.attempts_limit || 0) - (assessment.details?.attempts_count || 0)}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
             <Ionicons name="information-circle-outline" size={ms(14)} color="#64748B" />
             <Text style={styles.detailText}>{t('exam.duration', 'Duration')}: <Text style={styles.detailValue}>{assessment.details?.duration || 0} {t('common.min', 'minutes')}</Text></Text>
          </View>
          <View style={styles.detailItem}>
             <Ionicons name="time-outline" size={ms(14)} color="#64748B" />
             <Text style={styles.detailText}>{t('exam.started_at', 'Started at')}: <Text style={styles.detailValue}>{assessment.details?.started_at ? new Date(assessment.details.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</Text></Text>
          </View>
          <View style={styles.detailItem}>
             <Ionicons name="time-outline" size={ms(14)} color="#64748B" />
             <Text style={styles.detailText}>{t('exam.expires_at', 'Expires at')}: <Text style={styles.detailValue}>{assessment.details?.expires_at ? new Date(assessment.details.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</Text></Text>
          </View>
          <View style={styles.detailItem}>
             <Ionicons name="help-circle-outline" size={ms(14)} color="#64748B" />
             <Text style={styles.detailText}>{t('exam.attempt_id', 'Attempt ID')}: <Text style={styles.detailValue}>#{assessment.currentAttemptId}</Text></Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(40), paddingHorizontal: wp(20) }}
      >
        <View style={styles.questionCard}>
          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {t('exam.question', 'Question')} <Text style={styles.activeQuestionText}>{currentQuestionIndex + 1}</Text> {t('exam.of', 'of')} {questions.length}
              </Text>
              
              {selectedOptionId === null && currentQuestion.selected_option_id === null && (
                <View style={styles.skippedBadge}>
                  <MaterialCommunityIcons name="fast-forward" size={ms(12)} color="#F97316" />
                  <Text style={styles.skippedBadgeText}>{t('exam.skipped', 'Skipped')}</Text>
                </View>
              )}

              {isAnswerSelected && (
                <View style={styles.answerStatusBadge}>
                  <Ionicons name="checkmark-circle" size={ms(12)} color="#10B981" />
                  <Text style={styles.answerSelectedText}>{t('exam.saved', 'SAVED')}</Text>
                </View>
              )}
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* Question Section */}
          <View style={styles.questionContent}>
            <Text style={styles.questionText}>
              {currentQuestion.question_text || currentQuestion.text || `Question ${currentQuestionIndex + 1}`}
            </Text>

            {currentQuestion.file && (
              <TouchableOpacity onPress={() => setShowImageModal(true)} style={styles.imageContainer}>
                <Image source={{ uri: currentQuestion.file }} style={styles.questionImage} resizeMode="contain" />
                <View style={styles.zoomBadge}>
                  <Ionicons name="expand-outline" size={ms(12)} color="#fff" />
                  <Text style={styles.zoomText}>{t('exam.tap_zoom', 'Tap to Zoom')}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Image Zoom Modal */}
            <Modal visible={showImageModal} transparent={false} animationType="fade">
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.zoomControl} onPress={() => setImageScale(Math.max(0.5, imageScale - 0.5))}>
                    <Ionicons name="remove-circle-outline" size={ms(28)} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.scaleText}>{Math.round(imageScale * 100)}%</Text>
                  <TouchableOpacity style={styles.zoomControl} onPress={() => setImageScale(Math.min(5, imageScale + 0.5))}>
                    <Ionicons name="add-circle-outline" size={ms(28)} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeModal}
                    onPress={() => {
                      setShowImageModal(false);
                      setImageScale(1);
                    }}
                  >
                    <Ionicons name="close-circle" size={ms(32)} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={styles.modalScroll}
                  maximumZoomScale={5}
                  minimumZoomScale={0.5}
                  centerContent={true}
                >
                  <Image
                    source={{ uri: currentQuestion.file }}
                    style={[styles.fullImage, { transform: [{ scale: imageScale }] }]}
                    resizeMode="contain"
                  />
                </ScrollView>
              </View>
            </Modal>

            <View style={styles.optionsList}>
              {currentQuestion.options?.map((opt, index) => (
                <OptionItem
                  key={opt.id}
                  index={index}
                  text={opt.text}
                  selected={selectedOptionId === opt.id}
                  onPress={() => handleAnswer(opt.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtnPrev, currentQuestionIndex === 0 && { opacity: 0.3 }]}
              onPress={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons name="chevron-back" size={ms(16)} color="#475569" />
              <Text style={styles.navBtnPrevText}>{t('exam.previous', 'Previous')}</Text>
            </TouchableOpacity>

            <View style={styles.rightNavs}>
              <TouchableOpacity style={styles.navBtnSkip} onPress={handleSkip}>
                <MaterialCommunityIcons name="skip-next-outline" size={ms(18)} color="#475569" style={{marginRight: 4}} />
                <Text style={styles.navBtnSkipText}>{t('exam.skip', 'Skip')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navBtnNext}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.navBtnNextText}>
                  {currentQuestionIndex === questions.length - 1 ? t('exam.submit', 'Submit') : t('exam.next', 'Next')}
                </Text>
                <Ionicons name="chevron-forward" size={ms(16)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  noQuestionsText: {
    fontSize: fs(14),
    color: '#64748B',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: ms(12),
    padding: ms(15),
    marginHorizontal: wp(20),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(15),
  },
  detailsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconBg: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#1E293B',
  },
  attemptsInfo: {
    alignItems: 'flex-end',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: ms(6),
    marginBottom: hp(4),
  },
  countdownText: {
    fontSize: fs(12),
    fontWeight: '800',
    color: '#E11D48',
    marginLeft: wp(4),
  },
  attemptsLabel: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '500',
  },
  attemptsValue: {
    color: '#1E293B',
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  remainingValue: {
    color: '#16A34A',
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(10),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: hp(6),
  },
  detailText: {
    fontSize: fs(11),
    color: '#64748B',
    marginLeft: wp(6),
    fontWeight: '500',
  },
  detailValue: {
    color: '#1E293B',
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(15),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressContainer: {
    marginBottom: hp(20),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  progressText: {
    fontSize: fs(13),
    color: '#64748B',
    fontWeight: '600',
  },
  activeQuestionText: {
    color: '#1E293B',
    fontWeight: '800',
  },
  skippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  skippedBadgeText: {
    fontSize: fs(10),
    color: '#F97316',
    fontWeight: '700',
    marginLeft: wp(4),
  },
  answerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  answerSelectedText: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '700',
    marginLeft: wp(4),
  },
  progressBarTrack: {
    height: hp(5),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(3),
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: ms(3),
  },
  questionContent: {
    minHeight: hp(200),
  },
  questionText: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: fs(24),
    marginBottom: hp(20),
  },
  imageContainer: {
    marginVertical: hp(10),
    position: 'relative',
  },
  questionImage: {
    width: '100%',
    height: hp(180),
    borderRadius: ms(8),
    backgroundColor: '#F1F5F9',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: ms(8),
    right: ms(8),
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(12),
  },
  zoomText: {
    color: '#fff',
    fontSize: fs(10),
    fontWeight: '600',
    marginLeft: ms(4),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(50),
    paddingHorizontal: wp(20),
    paddingBottom: hp(20),
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  zoomControl: {
    padding: ms(10),
  },
  scaleText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
    minWidth: wp(60),
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
  },
  leaveModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(24),
    padding: ms(24),
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  closeModalX: {
    position: 'absolute',
    top: ms(16),
    right: ms(16),
    padding: ms(4),
  },
  warningIconContainer: {
    marginBottom: hp(20),
  },
  warningIconCircle: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveModalTitle: {
    fontSize: fs(22),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(12),
  },
  leaveModalMessage: {
    fontSize: fs(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: hp(8),
  },
  leaveModalHighlight: {
    fontSize: fs(14),
    color: '#F97316',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(24),
  },
  timerBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
    borderRadius: ms(12),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(30),
  },
  timerBadgeText: {
    fontSize: fs(14),
    color: '#64748B',
    fontWeight: '500',
  },
  timerBadgeValue: {
    color: '#2563EB',
    fontWeight: '800',
  },
  leaveModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: wp(12),
  },
  leaveCancelBtn: {
    flex: 1,
    height: hp(50),
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveCancelBtnText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#475569',
  },
  leaveSubmitBtn: {
    flex: 1,
    height: hp(50),
    borderRadius: ms(14),
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  leaveSubmitBtnText: {
    fontSize: fs(15),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  backBtnSmall: {
    padding: ms(4),
    marginRight: wp(4),
  },
  closeModal: {
    marginLeft: wp(20),
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: wp(100),
    height: hp(70),
  },
  optionsList: {
    gap: hp(10),
    marginBottom: hp(20),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(15),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionIcon: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
    backgroundColor: '#FFFFFF',
  },
  optionIconSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '500',
    color: '#475569',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(20),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navBtnPrev: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(15),
    borderRadius: ms(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtnPrevText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#64748B',
    marginLeft: wp(4),
  },
  rightNavs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtnSkip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(12),
    borderRadius: ms(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: wp(10),
  },
  navBtnSkipText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#64748B',
  },
  navBtnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: hp(10),
    paddingHorizontal: wp(20),
    borderRadius: ms(8),
    minWidth: wp(90),
  },
  navBtnNextText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
    marginRight: wp(4),
  },
});
