import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';

import { usePalette } from './theme';

/**
 * Scrollable form that stays above the keyboard. Android draws edge to edge, so the window is not
 * resized when the keyboard opens: the padding is added here on both platforms. The offset is the
 * header height because the keyboard position is measured from the top of the window.
 */
export function FormScreen({ children }: { children: ReactNode }) {
  const p = usePalette();
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: p.bg }]} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
});
