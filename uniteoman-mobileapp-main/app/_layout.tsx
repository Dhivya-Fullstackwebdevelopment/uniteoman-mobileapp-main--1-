import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/authStore';
import { useFavoritesStore } from '../store/favoritesStore';
import Sidebar from '../components/Sidebar';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 3 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const { initialize: initFavorites } = useFavoritesStore();

  useEffect(() => {
    Promise.all([initialize(), initFavorites()]).finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="business/[slug]"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
        <Sidebar />
        <StatusBar style="auto" />
      </QueryClientProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
