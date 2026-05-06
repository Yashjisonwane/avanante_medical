import { Redirect, useLocalSearchParams } from 'expo-router';

export default function DeepLinkHandler() {
  const params = useLocalSearchParams();
  
  // Redirect to the actual verify-email screen with the token from the URL
  return (
    <Redirect 
      href={{
        pathname: '/(auth)/verify-email',
        params: { token: params.token }
      }} 
    />
  );
}
