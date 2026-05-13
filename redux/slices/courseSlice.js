import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest } from '../api/baseApi';
import i18n from '../../i18n';

// Thunks — All using Hierarchy API endpoints
export const fetchLevelProgress = createAsyncThunk(
  'course/fetchLevelProgress',
  async (levelId) => {
    return apiRequest({
      endpoint: `/trainee/hierarchy/level/${levelId}?lang=${i18n.language}`,
      method: 'GET',
    });
  }
);

export const fetchModuleProgress = createAsyncThunk(
  'course/fetchModuleProgress',
  async (moduleId) => {
    return apiRequest({
      endpoint: `/trainee/hierarchy/module/${moduleId}?lang=${i18n.language}`,
      method: 'GET',
    });
  }
);

export const fetchChapterProgress = createAsyncThunk(
  'course/fetchChapterProgress',
  async (chapterId) => {
    return apiRequest({
      endpoint: `/trainee/hierarchy/chapter/${chapterId}`,
      method: 'GET',
    });
  }
);

export const fetchTopicProgress = createAsyncThunk(
  'course/fetchTopicProgress',
  async (topicId) => {
    return apiRequest({
      endpoint: `/trainee/hierarchy/topic/${topicId}?lang=${i18n.language}`,
      method: 'GET',
    });
  }
);

export const fetchDashboard = createAsyncThunk(
  'course/fetchDashboard',
  async () => {
    return apiRequest({
      endpoint: `/trainee/dashboard?lang=${i18n.language}`,
      method: 'GET',
    });
  }
);

export const getHierarchyThunk = createAsyncThunk(
  'course/fetchCourseHierarchy',
  async (params = {}) => {
    const { type, id } = params;
    let endpoint = `/trainee/hierarchy?lang=${i18n.language}`;
    if (type && id) {
      endpoint = `/trainee/hierarchy/${type}/${id}?lang=${i18n.language}`;
    }
    return apiRequest({
      endpoint,
      method: 'GET',
    });
  }
);

export const fetchChapterHierarchy = createAsyncThunk(
  'course/fetchChapterHierarchy',
  async (chapterId) => {
    return apiRequest({
      endpoint: `/trainee/hierarchy/chapter/${chapterId}`,
      method: 'GET',
    });
  }
);

export const fetchTopicContent = createAsyncThunk(
  'course/fetchTopicContent',
  async ({ topicId, page = 1, lang = i18n.language }) => {
    return apiRequest({
      endpoint: `/trainee/content/topics/${topicId}?page=${page}&lang=${lang}`,
      method: 'GET',
    });
  }
);

export const toggleTopicContentRead = createAsyncThunk(
  'course/toggleTopicContentRead',
  async (contentId) => {
    return apiRequest({
      endpoint: `/trainee/content/${contentId}/toggle-read`,
      method: 'POST',
    });
  }
);

export const fetchSinglePreview = createAsyncThunk(
  'course/fetchSinglePreview',
  async ({ topicId, contentId }) => {
    return apiRequest({
      endpoint: `/trainee/content/single-preview/${topicId}/${contentId}?lang=${i18n.language}`,
      method: 'GET',
    });
  }
);

// Thunks for Assessments
export const startAssessment = createAsyncThunk(
  'course/startAssessment',
  async (assessmentId) => {
    return apiRequest({
      endpoint: `/trainee/assessments/${assessmentId}/start`,
      method: 'POST',
    });
  }
);

export const fetchAssessmentQuestions = createAsyncThunk(
  'course/fetchAssessmentQuestions',
  async ({ assessmentId, attemptId }) => {
    return apiRequest({
      endpoint: `/trainee/assessments/${assessmentId}/questions?attempt_id=${attemptId}`,
      method: 'GET',
    });
  }
);

export const answerAssessmentQuestion = createAsyncThunk(
  'course/answerAssessmentQuestion',
  async (payload) => {
    return apiRequest({
      endpoint: '/trainee/assessments/answer',
      method: 'POST',
      body: payload,
    });
  }
);

export const resumeAssessment = createAsyncThunk(
  'course/resumeAssessment',
  async (assessmentId) => {
    return apiRequest({
      endpoint: `/trainee/assessments/${assessmentId}/resume`,
      method: 'GET',
    });
  }
);

export const submitAssessment = createAsyncThunk(
  'course/submitAssessment',
  async ({ assessmentId, attemptId }) => {
    return apiRequest({
      endpoint: `/trainee/assessments/${assessmentId}/submit`,
      method: 'POST',
      body: { attempt_id: attemptId },
    });
  }
);

export const submitAssessmentFeedback = createAsyncThunk(
  'course/submitAssessmentFeedback',
  async ({ assessmentId, payload }) => {
    return apiRequest({
      endpoint: `/trainee/assessments/${assessmentId}/feedback`,
      method: 'POST',
      body: {
        ...payload,
        assessment_id: assessmentId, // Include in body too
      },
    });
  }
);

export const fetchFaqs = createAsyncThunk(
  'course/fetchFaqs',
  async ({ type, id }) => {
    return apiRequest({
      endpoint: `/trainee/faqs/${type}/${id}?lang=${i18n.language}`,
      method: 'GET',
    });
  }
);

const initialState = {
  levels: [],
  currentLevel: null,
  currentModule: null,
  currentChapter: null,
  currentTopic: null,
  currentModules: [],
  currentChapters: [],
  currentTopics: [],
  topicContent: null,
  singlePreview: null,
  assessment: {
    details: null,
    questions: [],
    currentAttemptId: null,
    result: null,
    loading: false,
    error: null,
  },
  dashboard: null,
  loading: {
    levels: false,
    levelDetail: false,
    moduleDetail: false,
    chapterDetail: false,
    topicDetail: false,
    topicContent: false,
    singlePreview: false,
    assessmentAction: false,
    hierarchy: false,
  },
  error: null,
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    clearCourseError: (state) => {
      state.error = null;
    },
    clearTopicContent: (state) => {
      state.topicContent = null;
    },
    updateQuestionAnswer: (state, action) => {
      const { questionId, optionId } = action.payload;
      const question = state.assessment.questions.find(q => q.id === questionId);
      if (question) {
        question.selected_option_id = optionId;
      }
    },
    resetAssessment: (state) => {
      state.assessment = {
        details: null,
        questions: [],
        currentAttemptId: null,
        result: null,
        loading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Level Progress (hierarchy/level/{id} → extract modules)
      .addCase(fetchLevelProgress.pending, (state) => {
        state.loading.levelDetail = true;
        state.error = null;
      })
      .addCase(fetchLevelProgress.fulfilled, (state, action) => {
        state.loading.levelDetail = false;
        const data = action.payload.data || action.payload;
        state.currentLevel = data;
        // Extract modules from nested hierarchy response
        state.currentModules = data?.modules || (Array.isArray(data) ? data : []);
      })
      .addCase(fetchLevelProgress.rejected, (state, action) => {
        state.loading.levelDetail = false;
        state.error = action.error.message;
      })
      // Module Progress (hierarchy/module/{id} → extract chapters)
      .addCase(fetchModuleProgress.pending, (state) => {
        state.loading.moduleDetail = true;
      })
      .addCase(fetchModuleProgress.fulfilled, (state, action) => {
        state.loading.moduleDetail = false;
        const data = action.payload.data || action.payload;
        state.currentModule = data;
        // Extract chapters from nested hierarchy response
        state.currentChapters = data?.chapters || (Array.isArray(data) ? data : []);
      })
      // Chapter Progress (hierarchy/chapter/{id} → extract topics)
      .addCase(fetchChapterProgress.pending, (state) => {
        state.loading.chapterDetail = true;
      })
      .addCase(fetchChapterProgress.fulfilled, (state, action) => {
        state.loading.chapterDetail = false;
        const data = action.payload.data || action.payload;
        state.currentChapter = data;
        // Extract topics from nested hierarchy response
        state.currentTopics = data?.topics || (Array.isArray(data) ? data : []);
      })
      // Topic Progress
      .addCase(fetchTopicProgress.pending, (state) => {
        state.loading.topicDetail = true;
      })
      .addCase(fetchTopicProgress.fulfilled, (state, action) => {
        state.loading.topicDetail = false;
        state.currentTopic = action.payload.data || action.payload;
      })
      // Dashboard Data
      .addCase(fetchDashboard.pending, (state) => {
        state.loading.hierarchy = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading.hierarchy = false;
        state.error = null;
        state.dashboard = action.payload.data || action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading.hierarchy = false;
        state.error = action.error.message;
      })
      .addCase(getHierarchyThunk.pending, (state) => {
        state.loading.levels = true;
        state.error = null;
      })
      .addCase(getHierarchyThunk.fulfilled, (state, action) => {
        state.loading.levels = false;
        state.error = null;
        const data = action.payload.data || action.payload;

        if (data) {
          if (Array.isArray(data)) {
            // Check if data contains programs and extract levels
            if (data.length > 0 && data[0].type === 'program') {
              state.levels = data.reduce((acc, program) => {
                if (program.levels && Array.isArray(program.levels)) {
                  return acc.concat(program.levels);
                }
                return acc;
              }, []);
            } else {
              state.levels = data;
            }
          } else {
            // If it's a specific type, update current and sync list
            if (data.type === 'level' || (!data.type && data.modules)) {
              state.currentLevel = data;
              // Add to levels list if not present or update it
              const index = state.levels.findIndex(l => l.id === data.id);
              if (index !== -1) {
                state.levels[index] = { ...state.levels[index], ...data };
              } else {
                state.levels = [data, ...state.levels];
              }
            } else if (data.type === 'module') {
              state.currentModule = data;
            } else if (data.type === 'chapter') {
              state.currentChapter = data;
            }
          }
        }
      })
      .addCase(getHierarchyThunk.rejected, (state, action) => {
        state.loading.levels = false;
        state.error = action.error.message;
      })
      .addCase(fetchChapterHierarchy.pending, (state) => {
        state.loading.chapterDetail = true;
      })
      .addCase(fetchChapterHierarchy.fulfilled, (state, action) => {
        state.loading.chapterDetail = false;
        state.currentChapter = action.payload.data || action.payload;
      })
      // Topic Content
      .addCase(fetchTopicContent.pending, (state) => {
        state.loading.topicContent = true;
      })
      .addCase(fetchTopicContent.fulfilled, (state, action) => {
        state.loading.topicContent = false;
        state.topicContent = action.payload.data || action.payload;
      })
      .addCase(toggleTopicContentRead.fulfilled, (state, action) => {
        if (state.topicContent && state.topicContent.data) {
          const contentId = action.meta.arg;
          const contentIndex = state.topicContent.data.findIndex(c => c.id == contentId);
          if (contentIndex !== -1) {
            // API may return updated object or just { is_read: true/false }
            const payload = action.payload?.data || action.payload;
            const newIsRead = payload?.is_read !== undefined
              ? payload.is_read
              : true; // Default to true when toggled (first read)
            state.topicContent.data[contentIndex].is_read = newIsRead;
          }
        }
        // Also update singlePreview.current if it matches (API response nests content in .current)
        if (state.singlePreview?.current && state.singlePreview.current.id == action.meta.arg) {
          const payload = action.payload?.data || action.payload;
          state.singlePreview.current.is_read =
            payload?.is_read !== undefined ? payload.is_read : true;
        }
      })
      // Single Content Preview
      .addCase(fetchSinglePreview.pending, (state) => {
        state.loading.singlePreview = true;
      })
      .addCase(fetchSinglePreview.fulfilled, (state, action) => {
        state.loading.singlePreview = false;
        // API returns { success, data: { topic, current, navigation } }
        // Store the full data object so content-viewer can access .topic, .current, .navigation
        state.singlePreview = action.payload.data || action.payload;
      })
      .addCase(fetchSinglePreview.rejected, (state) => {
        state.loading.singlePreview = false;
      })
      // Assessment Actions
      .addCase(startAssessment.pending, (state) => {
        state.loading.assessmentAction = true;
      })
      .addCase(startAssessment.fulfilled, (state, action) => {
        state.loading.assessmentAction = false;
        state.assessment.currentAttemptId = action.payload.data?.attempt_id || action.payload.attempt_id;
      })
      .addCase(startAssessment.rejected, (state, action) => {
        state.loading.assessmentAction = false;
        state.assessment.error = action.error.message;
      })
      .addCase(resumeAssessment.fulfilled, (state, action) => {
        state.assessment.currentAttemptId = action.payload.data?.attempt_id || action.payload.attempt_id;
      })
      .addCase(resumeAssessment.rejected, (state, action) => {
        state.assessment.error = action.error.message;
      })
      .addCase(fetchAssessmentQuestions.fulfilled, (state, action) => {
        const payload = action.payload.data || action.payload;
        state.assessment.questions = payload.questions || [];
        state.assessment.details = {
          assessment_id: action.meta.arg.assessmentId,
          duration: payload.duration,
          expires_at: payload.expires_at,
          started_at: payload.started_at,
          attempts_limit: payload.attempts_limit,
          attempts_count: payload.attempts_count,
          title: state.assessment.details?.title, // Preserve title if exists
        };
      })
      .addCase(submitAssessment.fulfilled, (state, action) => {
        const response = action.payload.data || action.payload;
        state.assessment.currentAttemptId = null;
        state.assessment.questions = [];
        // Store assessment_id from details for feedback submission
        state.assessment.result = {
          ...response,
          assessment_id: state.assessment.details?.assessment_id || response.assessment_id
        };
      });
  },
});

export const { clearCourseError, clearTopicContent, updateQuestionAnswer, resetAssessment } = courseSlice.actions;
export default courseSlice.reducer;
