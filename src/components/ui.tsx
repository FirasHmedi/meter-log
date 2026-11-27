import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type TextInputProps, TextInput, View } from 'react-native';

import { usePalette } from './theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const p = usePalette();
  const bg = variant === 'primary' ? p.accent : 'transparent';
  const fg = variant === 'primary' ? p.accentText : variant === 'danger' ? p.danger : p.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'primary' ? p.accent : p.border, opacity: pressed || disabled ? 0.6 : 1 },
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
    >
      <MaterialIcons name={icon} size={24} color={p.text} />
    </Pressable>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: p.text }]}>{label}</Text>
      {children}
      {error ? <Text style={[styles.small, { color: p.danger }]}>{error}</Text> : null}
      {hint ? <Text style={[styles.small, { color: p.muted }]}>{hint}</Text> : null}
    </View>
  );
}

export function Input(props: TextInputProps) {
  const p = usePalette();
  return (
    <TextInput
      placeholderTextColor={p.muted}
      {...props}
      style={[styles.input, { color: p.text, borderColor: p.border, backgroundColor: p.surface }, props.style]}
    />
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: p.muted }]}>{title}</Text>
        {right}
      </View>
      <View style={[styles.sectionBody, { backgroundColor: p.surface, borderColor: p.border }]}>{children}</View>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  iconButton: { padding: 8 },
  field: { gap: 6, marginBottom: 18 },
  label: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 48, fontSize: 17 },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionBody: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
});
