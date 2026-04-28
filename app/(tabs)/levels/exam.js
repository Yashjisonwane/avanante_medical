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

  useEffect(() => {
    const initExam = async () => {
      if (assessment_id) {
        let attemptId = null;
        try {
          // Try to resume first
          const resumeResult = await dispatch(resumeAssessment(assessment_id)).unwrap();
          attemptId = resumeResult?.data?.attempt_id || resumeResult?.attempt_id;
        } catch (e) { }

        if (!attemptId) {
          try {
            // If no active attempt, start new
            const startResult = await dispatch(startAssessment(assessment_id)).unwrap();
            attemptId = startResult?.data?.attempt_id || startResult?.attempt_id;
          } catch (e) { }
        }

        if (attemptId) {
          dispatch(fetchAssessmentQuestions({ assessmentId: assessment_id, attemptId }));
        }
      }
    };
    initExam();
  }, [dispatch, assessment_id]);

  useEffect(() => {
    // Timer logic
    if (assessment.details?.expires_at) {
      const expiresAt = new Date(assessment.details.expires_at).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = expiresAt - now;
        if (diff <= 0) {
          setTimeLeft("00:00");
          // Optionally auto-submit here
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [assessment.details?.expires_at]);

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOptionId(currentQuestion.selected_option_id);
    }
  }, [currentQuestion]);

  const handleAnswer = async (optionId) => {
    if (selectedOptionId === optionId) return; // Already selected

    // Update local state for immediate feedback
    setSelectedOptionId(optionId);
    dispatch(updateQuestionAnswer({ questionId: currentQuestion.id, optionId }));

    if (assessment.currentAttemptId) {
      try {
        await dispatch(answerAssessmentQuestion({
          attempt_id: assessment.currentAttemptId,
          question_id: currentQuestion.id,
          selected_option_id: optionId
        })).unwrap();
      } catch (e) {
        console.error("Failed to submit answer", e);
      }
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      t('exam.submit', 'Submit Quiz'),
      t('exam.confirm_submit', 'Are you sure you want to submit your quiz?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.confirm', 'Submit'),
          onPress: async () => {
            if (assessment.currentAttemptId) {
              await dispatch(submitAssessment({
                assessmentId: assessment_id,
                attemptId: assessment.currentAttemptId
              }));
              router.push('/(tabs)/levels/quiz-result');
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
        <Text style={styles.noQuestionsText}>Preparing your quiz...</Text>
        <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: hp(10) }} />
      </View>
    );
  }

  const isAnswerSelected = selectedOptionId !== null && selectedOptionId !== undefined;
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top + hp(15) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButtonCircle}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={ms(22)} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Quiz Assessment</Text>
            <Text style={styles.headerSubtitle}>Test your knowledge</Text>
          </View>
        </View>

        {timeLeft && (
          <View style={styles.timerBox}>
            <Ionicons name="time" size={ms(18)} color="#E11D48" />
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerTime}>{timeLeft}</Text>
              <Text style={styles.timerLabel}>Remaining</Text>
            </View>
          </View>
        )}
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
              <View>
                <Text style={styles.progressLabel}>PROGRESS</Text>
                <Text style={styles.progressText}>
                  Question <Text style={styles.activeQuestionText}>{currentQuestionIndex + 1}</Text> of {questions.length}
                </Text>
              </View>
              {isAnswerSelected && (
                <View style={styles.answerStatusBadge}>
                  <Ionicons name="checkmark-circle" size={ms(12)} color="#10B981" />
                  <Text style={styles.answerSelectedText}>SAVED</Text>
                </View>
              )}
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Question Section */}
          <View style={styles.questionContent}>
            <Text style={styles.questionText}>
              {currentQuestion.question_text || currentQuestion.text}
            </Text>

            {currentQuestion.file && (
              <TouchableOpacity onPress={() => setShowImageModal(true)} style={styles.imageContainer}>
                <Image source={{ uri: currentQuestion.file }} style={styles.questionImage} resizeMode="contain" />
                <View style={styles.zoomBadge}>
                  <Ionicons name="expand-outline" size={ms(12)} color="#fff" />
                  <Text style={styles.zoomText}>Tap to Zoom</Text>
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
              <Ionicons name="arrow-back" size={ms(16)} color="#475569" />
              <Text style={styles.navBtnPrevText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.rightNavs}>
              <TouchableOpacity style={styles.navBtnSkip} onPress={handleSkip}>
                <Text style={styles.navBtnSkipText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navBtnNext}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.navBtnNextText}>
                  {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={ms(16)} color="#fff" />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(15),
    paddingBottom: hp(15),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: hp(15),
    flexWrap: 'wrap',
    gap: hp(10),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '60%',
  },
  backButtonCircle: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#1E293B',
    fontSize: fs(18),
    fontWeight: '800',
    marginBottom: hp(2),
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: fs(12),
    fontWeight: '500',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginLeft: wp(10),
  },
  timerTextContainer: {
    marginLeft: wp(8),
  },
  timerTime: {
    fontSize: fs(14),
    fontWeight: '800',
    color: '#FB7185',
  },
  timerLabel: {
    fontSize: fs(8),
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: ms(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  progressContainer: {
    marginBottom: hp(15),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: hp(10),
  },
  progressLabel: {
    fontSize: fs(10),
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: hp(2),
  },
  progressText: {
    fontSize: fs(14),
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeQuestionText: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  answerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(6),
  },
  answerSelectedText: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '800',
    marginLeft: wp(4),
  },
  progressBarTrack: {
    height: hp(6),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(3),
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: ms(3),
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hp(15),
  },
  questionContent: {
    minHeight: hp(250),
  },
  questionText: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: fs(26),
    marginBottom: hp(25),
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
    gap: hp(12),
    marginBottom: hp(30),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(18),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionIcon: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(15),
    backgroundColor: 'transparent',
  },
  optionIconSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  optionText: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '500',
    color: '#475569',
  },
  optionTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(25),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navBtnPrev: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(18),
    borderRadius: ms(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: wp(90),
  },
  navBtnPrevText: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#475569',
    marginLeft: wp(6),
  },
  rightNavs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtnSkip: {
    paddingVertical: hp(10),
    paddingHorizontal: wp(15),
    marginRight: wp(10),
  },
  navBtnSkipText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  navBtnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: hp(10),
    paddingHorizontal: wp(22),
    borderRadius: ms(10),
    minWidth: wp(100),
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtnNextText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '800',
    marginRight: wp(6),
  },
});
