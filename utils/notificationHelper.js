import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Suppress notification warnings in Expo Go for SDK 53+
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return 'PERMISSION_NOT_GRANTED';
    }

    // Get the project ID from constants
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn('Project ID not found in expoConfig. Make sure it is set in app.json.');
    }

    try {
      // Use getDevicePushTokenAsync to get the raw FCM (Android) or APNs (iOS) token
      // This is required for direct Firebase/FCM backend integrations.
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('Real FCM/Device Token:', token);
    } catch (e) {
      console.error('Error fetching device push token:', e.message);
      token = 'TOKEN_FETCH_ERROR';
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    token = 'SIMULATOR_NO_TOKEN';
  }

  return token;
}
