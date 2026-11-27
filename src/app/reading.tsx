import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { confirmDelete } from '@/components/confirm';
import { DateField } from '@/components/DateField';
import { usePalette } from '@/components/theme';
import { Button, Field, Input } from '@/components/ui';
import { useStore } from '@/data/store';
import { locale, t } from '@/i18n';
import { sortReadings, validateReading } from '@/lib/consumption';
import { dayFromDate } from '@/lib/dates';
import { formatDay, formatNumber, parseDecimal } from '@/lib/format';

export default function ReadingScreen() {
  const p = usePalette();
  const params = useLocalSearchParams<{ meterId: string; id?: string }>();
  const meterId = Number(params.meterId);
  const store = useStore();
  const meter = store.meters.find((m) => m.id === meterId);
  const readings = useMemo(() => store.readings.filter((r) => r.meterId === meterId), [store.readings, meterId]);
  const existing = params.id ? readings.find((r) => r.id === Number(params.id)) : undefined;
  const today = dayFromDate(new Date());

  const [date, setDate] = useState(existing?.date ?? today);
  const [valueText, setValueText] = useState(
    existing ? formatNumber(existing.value, locale, 3).replace(/[\s  ]/g, '') : '',
  );
  const [reset, setReset] = useState(existing?.reset ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previous = sortReadings(readings.filter((r) => r.id !== existing?.id && r.date < date)).pop();
  const unit = meter?.unit ?? '';

  async function save() {
    const value = parseDecimal(valueText);
    const err = validateReading(readings, { id: existing?.id, date, value, reset }, today);
    if (err) {
      setError(t(`err_${err}`));
      return;
    }
    setSaving(true);
    try {
      const input = { meterId, date, value, reset };
      if (existing) await store.updateReading(existing.id, input);
      else await store.addReading(input);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!existing) return;
    confirmDelete(
      t('deleteReading'),
      t('deleteReadingBody', { value: `${formatNumber(existing.value, locale, 3)} ${unit}`, date: formatDay(existing.date, locale) }),
      async () => {
        await store.deleteReading(existing.id);
        router.back();
      },
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? t('editReading') : t('addReading') }} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {meter ? <Text style={[s.meter, { color: p.muted }]}>{meter.name}</Text> : null}
        <Field label={t('date')}>
          <DateField
            value={date}
            max={today}
            onChange={(d) => {
              setDate(d);
              setError(null);
            }}
          />
        </Field>
        <Field
          label={t('value', { unit })}
          error={error}
          hint={
            previous
              ? t('previousReading', { value: `${formatNumber(previous.value, locale, 3)} ${unit}`, date: formatDay(previous.date, locale) })
              : undefined
          }
        >
          <Input
            value={valueText}
            onChangeText={(v) => {
              setValueText(v);
              setError(null);
            }}
            placeholder={t('valuePlaceholder')}
            keyboardType="decimal-pad"
            autoFocus={!existing}
            onSubmitEditing={save}
          />
        </Field>
        <View style={[s.resetRow, { borderColor: p.border, backgroundColor: p.surface }]}>
          <View style={s.resetText}>
            <Text style={[s.resetLabel, { color: p.text }]}>{t('resetLabel')}</Text>
            <Text style={[s.small, { color: p.muted }]}>{t('resetHint')}</Text>
          </View>
          <Switch
            accessibilityLabel={t('resetLabel')}
            value={reset}
            onValueChange={(v) => {
              setReset(v);
              setError(null);
            }}
            trackColor={{ true: p.accent }}
          />
        </View>
        <View style={s.actions}>
          <Button label={t('save')} icon="check" onPress={save} disabled={saving} />
          {existing ? <Button label={t('delete')} icon="delete-outline" variant="danger" onPress={remove} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  meter: { fontSize: 15, marginBottom: 12 },
  resetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20 },
  resetText: { flex: 1, gap: 4 },
  resetLabel: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18 },
  actions: { gap: 12 },
});
