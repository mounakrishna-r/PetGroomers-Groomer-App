import { Stack } from 'expo-router';
import { AuthProvider } from '../components/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="profile/edit-profile" 
          options={{ 
            title: 'Edit Profile',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="profile/service-settings" 
          options={{ 
            title: 'Service Settings',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="profile/help-support" 
          options={{ 
            title: 'Help & Support',
            headerShown: true,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}