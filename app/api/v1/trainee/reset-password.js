import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ResetPasswordLinkHandler() {
  const params = useLocalSearchParams();
  
  // Redirect to the create-password screen with the token from the URL
  return (
    <Redirect 
      href={{
        pathname: '/(auth)/create-password',
        params: { token: params.token }
      }} 
    />
  );
}
