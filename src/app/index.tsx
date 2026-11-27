import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KIND_ICONS, usePalette } from '@/components/theme';
import { Button, IconButton } from '@/components/ui';
import { useStore } from '@/data/store';
import { locale, t } from '@/i18n';
import { intervals, recentDailyAverage, sortReadings } from '@/lib/consumption';
import { formatDay, formatNumber } from '@/lib/format';

export default function MetersScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { meters, readings, ready, persistent } = useStore();

  return (
    <View style={[s.screen, { backgroundColor: p.bg }]}>
      <Stack.Screen
        options={{
          headerRight: () => <IconButton icon="settings" label={t('settings')} onPress={() => router.push('/settings')} />,
        }}
      />
      {!persistent ? (
        <Text style={[s.banner, { backgroundColor: p.warnBg, color: p.text }]}>{t('webPreview')}</Text>
      ) : null}
      <FlatList
        data={meters}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 96 }]}
        ListEmptyComponent={
          ready ? (
            <View style={s.empty}>
              <MaterialIcons name="speed" size={48} color={p.muted} />
              <Text style={[s.emptyTitle, { color: p.text }]}>{t('noMeters')}</Text>
              <Text style={[s.emptyText, { color: p.muted }]}>{t('noMetersHint')}</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const mine = sortReadings(readings.filter((r) => r.meterId === item.id));
          const last = mine[mine.length - 1];
          const avg = recentDailyAverage(intervals(mine));
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/meter/[id]', params: { id: String(item.id) } })}
              style={({ pressed }) => [s.row, { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[s.icon, { backgroundColor: p.bg }]}>
                <MaterialIcons name={KIND_ICONS[item.kind]} size={24} color={p.accent} />
              </View>
              <View style={s.rowText}>
                <Text style={[s.name, { color: p.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[s.meta, { color: p.muted }]} numberOfLines={2}>
                  {last
                    ? `${formatNumber(last.value, locale, 3)} ${item.unit} · ${formatDay(last.date, locale)}`
                    : t('noReadings')}
                </Text>
                {avg !== null ? (
                  <Text style={[s.avg, { color: p.text }]}>
                    {t('perDayValue', { value: formatNumber(avg, locale), unit: item.unit })}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons name="chevron-right" size={24} color={p.muted} />
            </Pressable>
          );
        }}
      />
      <View style={[s.fab, { bottom: insets.bottom + 16 }]}>
        <Button icon="add" label={t('addMeter')} onPress={() => router.push('/meter/edit')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  banner: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 13 },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14 },
  avg: { fontSize: 14, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', left: 16, right: 16 },
});
