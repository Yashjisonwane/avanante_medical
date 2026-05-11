import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import './../i18n'; // Import i18n configuration
import { store } from '../redux/store';
import { hydrateAuth } from '../redux/slices/authSlice';
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';
import { fetchUnreadCount } from '../redux/slices/notificationSlice';

function AppNavigator() {
  const dispatch = useDispatch();
  const { language } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  // Sync i18n with Redux language state
  useEffect(() => {
    if (language) {
      const i18n = require('./../i18n').default;
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    // In SDK 53+, remote notifications are removed from Expo Go
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    
    if (!isExpoGo) {
      registerForPushNotificationsAsync();

      // Listen for notifications while the app is foregrounded
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('--- NOTIFICATION RECEIVED ---');
        console.log('Title:', notification.request.content.title);
        console.log('Body:', notification.request.content.body);
        console.log('Data:', notification.request.content.data);
        
        // Update the notification bell count automatically
        dispatch(fetchUnreadCount());
      });

      // Listen for user interaction with a notification
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('--- NOTIFICATION INTERACTION ---');
        console.log('Action:', response.actionIdentifier);
        console.log('Notification Data:', response.notification.request.content.data);
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    } else {
      console.log('Push notifications are disabled in Expo Go. Use a development build for full notification support.');
    }
  }, [dispatch]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // Default to true if you want bars, false for full splash/login
          animation: 'fade', // Smooth transitions
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/forget-password" />
        <Stack.Screen name="(auth)/create-password" />
        <Stack.Screen name="(auth)/verify-email" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="notifications/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
