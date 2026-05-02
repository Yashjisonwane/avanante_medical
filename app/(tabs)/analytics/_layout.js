import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="level-result" />
      <Stack.Screen name="certificate" />
      <Stack.Screen name="audit-logs" />
      <Stack.Screen name="user-progress" />
      <Stack.Screen name="certification-report" />
    </Stack>
  );
}
