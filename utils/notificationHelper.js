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
      // In SDK 51+, getExpoPushTokenAsync is the standard for both Expo Go and Development Builds
      // if you want to use Expo's push service. 
      // If you specifically need the raw FCM token for your own backend, use getDevicePushTokenAsync.
      
      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = expoToken.data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.warn('Error fetching Expo push token, trying device token:', e.message);
      try {
        // Fallback to device token (FCM/APNs)
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        token = deviceToken.data;
        console.log('Device Push Token:', token);
      } catch (deviceErr) {
        console.error('Error fetching device push token:', deviceErr.message);
        token = 'TOKEN_FETCH_ERROR';
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    token = 'SIMULATOR_NO_TOKEN';
  }

  return token;
}
