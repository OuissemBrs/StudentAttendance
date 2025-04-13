import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AttendanceProvider } from '@/context/AttendanceContext';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AttendanceProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="group/new" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]/student/new" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]/attendance/new" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
      <StatusBar style="auto" />
    </AttendanceProvider>
  );
}