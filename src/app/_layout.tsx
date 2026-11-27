import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { usePalette } from '@/components/theme';
import { StoreProvider } from '@/data/store';
import { t } from '@/i18n';

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = usePalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: p.bg, card: p.surface, text: p.text, border: p.border, primary: p.accent },
  };
  return (
    <ThemeProvider value={theme}>
      <StoreProvider>
        <Stack screenOptions={{ headerTitleStyle: { fontWeight: '700' } }}>
          <Stack.Screen name="index" options={{ title: t('appName') }} />
          <Stack.Screen name="meter/[id]" options={{ title: '' }} />
          <Stack.Screen name="meter/edit" options={{ title: t('newMeter'), presentation: 'modal' }} />
          <Stack.Screen name="reading" options={{ title: t('addReading'), presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: t('settings') }} />
        </Stack>
        <StatusBar style="auto" />
      </StoreProvider>
    </ThemeProvider>
  );
}
