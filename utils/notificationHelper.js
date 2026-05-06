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
      return;
    }
    // SDK 53+ and recent Expo Go versions don't support native FCM tokens in Expo Go.
    // We check if we are running in Expo Go or a standalone build.
    const isExpoGo = Device.brand === null || !Device.isDevice || (Platform.OS === 'android' && !Constants.appOwnership);
    
    try {
      if (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient') {
        // We are in Expo Go
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
        console.log('Expo Go Push Token:', token);
      } else {
        // We are in a Standalone/Development Build
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('Native Device Push Token (FCM/APNs):', token);
      }
    } catch (e) {
      console.warn('Error fetching push token:', e.message);
      token = 'TOKEN_FETCH_ERROR';
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    token = 'SIMULATOR_NO_TOKEN';
  }

  return token;
}
