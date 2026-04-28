import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';

const BASE_URL = 'https://lms-backend.netswaptech.com/api/v1';
const ACCESS_TOKEN_KEY = 'auth_access_token';

let inMemoryToken = null;

const extractErrorMessage = (payload) => {
  if (!payload) {
    return 'Something went wrong.';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const firstErrorValue = Object.values(payload.errors)[0];
    if (Array.isArray(firstErrorValue) && firstErrorValue.length > 0) {
      return String(firstErrorValue[0]);
    }
    if (typeof firstErrorValue === 'string' && firstErrorValue.trim()) {
      return firstErrorValue;
    }
  }

  if (payload.data && typeof payload.data.message === 'string' && payload.data.message.trim()) {
    return payload.data.message;
  }

  return 'Something went wrong.';
};

const parseApiResponse = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

export const getBaseUrl = () => BASE_URL;

export const setAccessToken = async (token) => {
  inMemoryToken = token || null;
  if (token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const loadAccessToken = async () => {
  if (inMemoryToken) {
    return inMemoryToken;
  }

  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  inMemoryToken = token;
  return token;
};

export const clearAccessToken = async () => {
  inMemoryToken = null;
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const buildAuthHeaders = async (customHeaders = {}) => {
  const token = await loadAccessToken();
  return {
    Accept: 'application/json',
    'Accept-Language': i18n.language || 'en',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

export const apiRequest = async ({
  endpoint,
  method = 'GET',
  body,
  headers = {},
  isFormData = false,
}) => {
  const requestHeaders = await buildAuthHeaders(headers);
  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await parseApiResponse(response);

  if (__DEV__) {
    console.log('[API]', method, endpoint, 'status:', response.status, 'response:', data);
  }

  if (!response.ok) {
    const errorMessage = extractErrorMessage(data);
    throw new Error(errorMessage);
  }

  return data;
};
