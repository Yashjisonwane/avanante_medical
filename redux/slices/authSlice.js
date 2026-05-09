import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  apiRequest,
  clearAccessToken,
  loadAccessToken,
  setAccessToken,
} from '../api/baseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';

const readTokenFromResponse = (payload = {}) =>
  payload?.token || payload?.access_token || payload?.data?.token || payload?.data?.access_token || null;

const buildRegisterFormData = (formValues = {}) => {
  const formData = new FormData();
  Object.entries(formValues).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    formData.append(key, value);
  });
  return formData;
};

const normalizePayload = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );

export const hydrateAuth = createAsyncThunk('auth/hydrateAuth', async () => {
  const token = await loadAccessToken();
  const language = await AsyncStorage.getItem('user-language');
  const preferredLanguage = language || i18n.language || 'en';
  const normalizedLanguage = preferredLanguage.split('-')[0];
  await i18n.changeLanguage(normalizedLanguage);
  return { token, language: normalizedLanguage };
});

export const setLanguage = createAsyncThunk('auth/setLanguage', async (language) => {
  const normalizedLanguage = language.split('-')[0];
  await AsyncStorage.setItem('user-language', normalizedLanguage);
  await i18n.changeLanguage(normalizedLanguage);
  return normalizedLanguage;
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload) => {
  const cleanPayload = normalizePayload(payload);
  const response = await apiRequest({
    endpoint: '/trainee/login',
    method: 'POST',
    body: cleanPayload,
  });

  const token = readTokenFromResponse(response);
  if (token) {
    await setAccessToken(token);
  }

  return { response, token };
});

export const registerUser = createAsyncThunk('auth/registerUser', async (payload) => {
  const cleanPayload = normalizePayload(payload);
  const formData = buildRegisterFormData(cleanPayload);
  return apiRequest({
    endpoint: '/trainee/register',
    method: 'POST',
    body: formData,
    isFormData: true,
  });
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (payload) =>
  apiRequest({
    endpoint: '/trainee/forgot-password',
    method: 'POST',
    body: normalizePayload(payload),
  }),
);

export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload) =>
  apiRequest({
    endpoint: '/trainee/reset-password',
    method: 'POST',
    body: normalizePayload(payload),
  }),
);

export const verifyEmail = createAsyncThunk('auth/verifyEmail', async (token) =>
  apiRequest({
    endpoint: `/trainee/verify-email?token=${encodeURIComponent(token)}`,
    method: 'GET',
  }),
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async () =>
  apiRequest({
    endpoint: '/trainee/profile',
    method: 'GET',
  }),
);

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload) => {
  const formData = buildRegisterFormData(payload);
  return apiRequest({
    endpoint: '/trainee/update-profile',
    method: 'POST',
    body: formData,
    isFormData: true,
  });
});

export const changePassword = createAsyncThunk('auth/changePassword', async (payload) =>
  apiRequest({
    endpoint: '/trainee/change-password',
    method: 'POST',
    body: normalizePayload(payload),
  }),
);

export const fetchRoles = createAsyncThunk('auth/fetchRoles', async () =>
  apiRequest({
    endpoint: '/common/roles?status=all',
    method: 'GET',
  }),
);

export const fetchDesignations = createAsyncThunk('auth/fetchDesignations', async () =>
  apiRequest({
    endpoint: '/common/designations?status=all',
    method: 'GET',
  }),
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  try {
    await apiRequest({
      endpoint: '/trainee/logout',
      method: 'POST',
    });
  } catch (error) {
    console.warn('Logout API failed, clearing local state anyway:', error.message);
  } finally {
    await clearAccessToken();
  }
});

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  language: 'en',
  actionLoading: {
    login: false,
    register: false,
    forgotPassword: false,
    resetPassword: false,
    verifyEmail: false,
    logout: false,
    profile: false,
    updateProfile: false,
    changePassword: false,
  },
  successMessage: '',
  errorMessage: '',
  roles: [],
  designations: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthMessages: (state) => {
      state.successMessage = '';
      state.errorMessage = '';
    },
    forceLogout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.successMessage = '';
      state.errorMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.language = action.payload.language;
        state.isAuthenticated = Boolean(action.payload.token);
        state.isHydrated = true;
      })
      .addCase(setLanguage.fulfilled, (state, action) => {
        state.language = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.actionLoading.login = true;
        state.errorMessage = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.actionLoading.login = false;
        state.token = action.payload.token;
        state.user = action.payload.response?.user || action.payload.response?.data?.user || null;
        state.isAuthenticated = Boolean(action.payload.token);
        state.successMessage = action.payload.response?.message || 'Login successful.';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.actionLoading.login = false;
        state.errorMessage = action.error.message || 'Unable to login.';
      })
      .addCase(registerUser.pending, (state) => {
        state.actionLoading.register = true;
        state.errorMessage = '';
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.actionLoading.register = false;
        state.successMessage = action.payload?.message || 'Registration completed successfully.';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.actionLoading.register = false;
        state.errorMessage = action.error.message || 'Unable to register.';
      })
      .addCase(forgotPassword.pending, (state) => {
        state.actionLoading.forgotPassword = true;
        state.errorMessage = '';
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.actionLoading.forgotPassword = false;
        state.successMessage = action.payload?.message || 'Password reset mail sent successfully.';
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.actionLoading.forgotPassword = false;
        state.errorMessage = action.error.message || 'Unable to send forgot password request.';
      })
      .addCase(resetPassword.pending, (state) => {
        state.actionLoading.resetPassword = true;
        state.errorMessage = '';
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.actionLoading.resetPassword = false;
        state.successMessage = action.payload?.message || 'Password updated successfully.';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.actionLoading.resetPassword = false;
        state.errorMessage = action.error.message || 'Unable to reset password.';
      })
      .addCase(verifyEmail.pending, (state) => {
        state.actionLoading.verifyEmail = true;
        state.errorMessage = '';
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.actionLoading.verifyEmail = false;
        state.successMessage = action.payload?.message || 'Email verified successfully.';
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.actionLoading.verifyEmail = false;
        state.errorMessage = action.error.message || 'Email verification failed.';
      })
      .addCase(logoutUser.pending, (state) => {
        state.actionLoading.logout = true;
        state.errorMessage = '';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.actionLoading.logout = false;
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.successMessage = 'Logged out successfully.';
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.actionLoading.logout = false;
        // Even if API failed, we consider it a successful local logout
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.errorMessage = '';
      })
      // Profile
      .addCase(fetchProfile.pending, (state) => {
        state.actionLoading.profile = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.actionLoading.profile = false;
        state.user = action.payload?.data || action.payload?.user || action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.actionLoading.profile = false;
        state.errorMessage = action.error.message || 'Failed to load profile.';
      })
      .addCase(updateProfile.pending, (state) => {
        state.actionLoading.updateProfile = true;
        state.errorMessage = '';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.actionLoading.updateProfile = false;
        state.successMessage = action.payload?.message || 'Profile updated successfully.';
        if (action.payload?.data) {
          state.user = action.payload.data;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.actionLoading.updateProfile = false;
        state.errorMessage = action.error.message || 'Unable to update profile.';
      })
      .addCase(changePassword.pending, (state) => {
        state.actionLoading.changePassword = true;
        state.errorMessage = '';
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.actionLoading.changePassword = false;
        state.successMessage = action.payload?.message || 'Password changed successfully.';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.actionLoading.changePassword = false;
        state.errorMessage = action.error.message || 'Unable to change password.';
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload?.data || action.payload || [];
      })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.designations = action.payload?.data || action.payload || [];
      })
      .addMatcher(
        (action) => 
          action.type.endsWith('/rejected') && 
          (action.error?.message?.toLowerCase().includes('unauthorized') || 
           action.error?.message?.toLowerCase().includes('unauthenticated')),
        (state) => {
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
        }
      );
  },
});

export const { clearAuthMessages, forceLogout } = authSlice.actions;
export default authSlice.reducer;
