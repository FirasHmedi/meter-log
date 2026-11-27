import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { usePalette } from '@/components/theme';
import { Button, Section } from '@/components/ui';
import { cancelReminder, remindersAvailable, scheduleMonthlyReminder } from '@/data/reminder';
import { useStore } from '@/data/store';
import { t } from '@/i18n';
import { pinWidget, widgetsAvailable } from '@/widget/update';

const DAYS = [1, 5, 10, 15, 20, 25, 28];

export default function SettingsScreen() {
  const p = usePalette();
  const store = useStore();
  const { settings } = store;
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [widgetMessage, setWidgetMessage] = useState<string | null>(null);

  async function addWidget() {
    setWidgetMessage(null);
    if (!(await pinWidget())) setWidgetMessage(t('widgetAddManual'));
  }

  async function apply(enabled: boolean, day: number) {
    setBusy(true);
    setMessage(null);
    try {
      if (!enabled) {
        await cancelReminder(settings.reminderId);
        await store.saveSettings({ reminderEnabled: false, reminderDay: day, reminderId: null });
        return;
      }
      const res = await scheduleMonthlyReminder(day, settings.reminderId);
      if (res.ok) {
        await store.saveSettings({ reminderEnabled: true, reminderDay: day, reminderId: res.id });
      } else {
        setMessage(res.reason === 'denied' ? t('reminderDenied') : t('reminderUnavailable'));
        await store.saveSettings({ reminderEnabled: false, reminderDay: day, reminderId: null });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={s.content}>
      <Section title={t('reminder')}>
        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={[s.label, { color: p.text }]}>{t('reminder')}</Text>
            <Text style={[s.small, { color: p.muted }]}>{t('reminderHint')}</Text>
          </View>
          <Switch
            accessibilityLabel={t('reminder')}
            value={settings.reminderEnabled}
            disabled={busy || !remindersAvailable}
            onValueChange={(v) => apply(v, settings.reminderDay)}
            trackColor={{ true: p.accent }}
          />
        </View>
        {settings.reminderEnabled ? (
          <View style={[s.daysBlock, { borderTopColor: p.border }]}>
            <Text style={[s.small, { color: p.muted }]}>
              {t('reminderDay')} · {t('reminderTime')}
            </Text>
            <View style={s.days}>
              {DAYS.map((d) => {
                const selected = d === settings.reminderDay;
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    disabled={busy}
                    onPress={() => apply(true, d)}
                    style={[s.day, { borderColor: selected ? p.accent : p.border, backgroundColor: selected ? p.accent : p.surface }]}
                  >
                    <Text style={{ color: selected ? p.accentText : p.text, fontWeight: '600' }}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        {message || !remindersAvailable ? (
          <Text style={[s.small, s.message, { color: p.danger }]}>{message ?? t('reminderUnavailable')}</Text>
        ) : null}
      </Section>

      {widgetsAvailable ? (
        <Section title={t('widget')}>
          <View style={s.about}>
            <Text style={[s.small, { color: p.muted }]}>{t('widgetAddHint')}</Text>
            <Button testID="add-widget" icon="widgets" variant="secondary" label={t('widgetAdd')} onPress={addWidget} />
            {widgetMessage ? <Text style={[s.small, { color: p.text }]}>{widgetMessage}</Text> : null}
          </View>
        </Section>
      ) : null}

      <Section title={t('about')}>
        <View style={s.about}>
          <Text style={[s.body, { color: p.text }]}>{t('aboutBody')}</Text>
          <Text style={[s.small, { color: p.muted }]}>{t('sourceCode')}</Text>
          <Text style={[s.small, { color: p.muted }]}>{t('version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
        </View>
      </Section>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowText: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 22 },
  message: { paddingHorizontal: 14, paddingBottom: 14 },
  daysBlock: { padding: 14, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  about: { padding: 14, gap: 8 },
});
