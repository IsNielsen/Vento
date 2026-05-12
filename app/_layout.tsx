import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { LLMProvider } from '@/hooks/useLLM';
import { ModelDownloadGate } from '@/components/ModelDownloadGate';
import { initDb } from '@/store/db';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      initDb()
        .then(() => setDbReady(true))
        .catch(err => {
          console.error('Database initialization failed:', err);
          setDbError(true);
        })
        .finally(() => SplashScreen.hideAsync());
    }
  }, [loaded]);

  if (!loaded || (!dbReady && !dbError)) return null;

  if (dbError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: '#EF4444' }}>
          Failed to open database. Please restart the app.
        </Text>
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LLMProvider>
        <ModelDownloadGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="chat/[id]" />
          </Stack>
        </ModelDownloadGate>
      </LLMProvider>
    </ThemeProvider>
  );
}
