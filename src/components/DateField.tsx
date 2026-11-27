import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { locale, t } from '@/i18n';
import { addDays, dateFromDay, dayFromDate, type IsoDay } from '@/lib/dates';
import { formatDay } from '@/lib/format';

import { usePalette } from './theme';

/** Day picker: arrows for the previous / next day, tap on the date opens the Android calendar. */
export function DateField({ value, onChange, max }: { value: IsoDay; onChange: (day: IsoDay) => void; max: IsoDay }) {
  const p = usePalette();

  function openPicker() {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: dateFromDay(value),
      mode: 'date',
      maximumDate: dateFromDay(max),
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(dayFromDate(date));
      },
    });
  }

  const canNext = value < max;
  return (
    <View style={[s.row, { borderColor: p.border, backgroundColor: p.surface }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('previousDay')} hitSlop={6} style={s.arrow} onPress={() => onChange(addDays(value, -1))}>
        <MaterialIcons name="chevron-left" size={28} color={p.accent} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('date')} style={s.center} onPress={openPicker}>
        <MaterialIcons name="event" size={20} color={p.muted} />
        <Text style={[s.text, { color: p.text }]}>{value === max ? `${t('today')} · ` : ''}{formatDay(value, locale)}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('nextDay')}
        accessibilityState={{ disabled: !canNext }}
        disabled={!canNext}
        hitSlop={6}
        style={[s.arrow, { opacity: canNext ? 1 : 0.3 }]}
        onPress={() => onChange(addDays(value, 1))}
      >
        <MaterialIcons name="chevron-right" size={28} color={p.accent} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, minHeight: 52 },
  arrow: { paddingHorizontal: 10, minHeight: 52, justifyContent: 'center' },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 },
  text: { fontSize: 16, fontWeight: '500' },
});
