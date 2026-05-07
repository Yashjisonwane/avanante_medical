import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest } from '../api/baseApi';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (page = 1) => {
    const response = await apiRequest({
      endpoint: `/trainee/notifications?page=${page}`,
      method: 'GET',
    });
    return response;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const response = await apiRequest({
      endpoint: '/trainee/notifications/unread-count',
      method: 'GET',
    });
    return response;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id) => {
    const response = await apiRequest({
      endpoint: `/trainee/notifications/read/${id}`,
      method: 'POST', // Changed from GET to POST as per project standard for mutations
    });
    return { id, response };
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
    loading: false,
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
    },
    error: null,
  },
  reducers: {
    clearNotifications: (state) => {
      state.list = [];
      state.unreadCount = 0;
    },
    markReadLocal: (state, action) => {
      const id = action.payload;
      const index = state.list.findIndex((n) => n.id == id);
      if (index !== -1) {
        const item = state.list[index];
        const wasUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
        if (wasUnread) {
          state.list[index].is_read = 1;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data || [];
        
        // Update unreadCount if provided in the main response
        if (action.payload?.unread_count !== undefined) {
          state.unreadCount = action.payload.unread_count;
        }

        if (action.meta.arg === 1) {
          state.list = data;
        } else {
          state.list = [...state.list, ...data];
        }
        state.pagination = {
          currentPage: action.payload?.current_page || 1,
          lastPage: action.payload?.last_page || 1,
          total: action.payload?.total || 0,
        };
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload?.unread_count ?? action.payload?.data?.unread_count ?? 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload.id;
        const index = state.list.findIndex((n) => n.id == id);
        
        if (index !== -1) {
          const item = state.list[index];
          // Robust check for unread status
          const wasUnread = !(item.is_read === true || item.is_read == 1 || item.is_read === '1');
          
          if (action.payload.response?.data && typeof action.payload.response.data === 'object') {
            state.list[index] = { 
              ...state.list[index], 
              ...action.payload.response.data,
              is_read: 1 // Always force to read in local state
            };
          } else {
            state.list[index].is_read = 1;
          }

          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      });
  },
});

export const { clearNotifications, markReadLocal } = notificationSlice.actions;
export default notificationSlice.reducer;
