import { Stack } from 'expo-router';

export default function LevelsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="module-details" />
      <Stack.Screen name="chapter-details" />
      <Stack.Screen name="topic-details" />
      <Stack.Screen name="subtopic-list" />
      <Stack.Screen name="exam" />
      <Stack.Screen name="quiz-result" />
    </Stack>
  );
}
