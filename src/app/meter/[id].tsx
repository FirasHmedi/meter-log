import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmDelete, notify } from '@/components/confirm';
import { MonthlyChart } from '@/components/MonthlyChart';
import { usePalette } from '@/components/theme';
import { Button, IconButton, Section } from '@/components/ui';
import { shareReadingsCsv } from '@/data/export';
import { useStore } from '@/data/store';
import { currency, locale, t } from '@/i18n';
import {
  consumptionByReading,
  cost,
  currentMonthEstimate,
  intervals,
  lastMonths,
  monthlyTotals,
  projection,
  recentDailyAverage,
  sortReadings,
} from '@/lib/consumption';
import { dayFromDate, monthOf } from '@/lib/dates';
import { formatDay, formatMoney, formatMonth, formatNumber } from '@/lib/format';

export default function MeterScreen() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const meter = store.meters.find((m) => m.id === Number(id));
  const readings = useMemo(
    () => sortReadings(store.readings.filter((r) => r.meterId === Number(id))),
    [store.readings, id],
  );
  const today = dayFromDate(new Date());

  const stats = useMemo(() => {
    const ivs = intervals(readings);
    return {
      avg: recentDailyAverage(ivs),
      month: currentMonthEstimate(readings, today),
      next30: projection(readings, 30),
      months: lastMonths(monthlyTotals(ivs), monthOf(today), 12),
      byReading: consumptionByReading(readings),
    };
  }, [readings, today]);

  if (!meter) {
    return <View style={{ flex: 1, backgroundColor: p.bg }} />;
  }
  const unit = meter.unit;
  const num = (v: number) => formatNumber(v, locale);
  const money = (v: number | null) => (v === null ? null : formatMoney(v, locale, currency));

  async function exportCsv() {
    if (!meter) return;
    const ok = await shareReadingsCsv(meter.name, unit, readings);
    if (!ok) notify(t('exportUnavailable'));
  }

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Stack.Screen
        options={{
          title: meter.name,
          headerRight: () => (
            <View style={s.headerButtons}>
              {readings.length > 0 ? <IconButton icon="ios-share" label={t('exportCsv')} onPress={exportCsv} /> : null}
              <IconButton
                icon="edit"
                label={t('editMeter')}
                onPress={() => router.push({ pathname: '/meter/edit', params: { id: String(meter.id) } })}
              />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.addButton}>
          <Button
            icon="add"
            label={t('addReading')}
            onPress={() => router.push({ pathname: '/reading', params: { meterId: String(meter.id) } })}
          />
        </View>

        {stats.avg !== null && stats.month ? (
          <Section title={t('thisMonth')}>
            <View style={s.statBlock}>
              <Text style={[s.bigValue, { color: p.text }]}>
                {num(stats.month.estimated)} {unit}
                {meter.pricePerUnit !== null ? (
                  <Text style={[s.bigCost, { color: p.accent }]}>  {money(cost(stats.month.estimated, meter.pricePerUnit))}</Text>
                ) : null}
              </Text>
              <Text style={[s.small, { color: p.muted }]}>
                {formatMonth(stats.month.month, locale)} ·{' '}
                {t('measuredSoFar', { value: num(stats.month.measured), unit, days: stats.month.measuredDays })}
              </Text>
            </View>
            <View style={[s.statRow, { borderTopColor: p.border }]}>
              <Text style={[s.statLabel, { color: p.muted }]}>{t('perDay')}</Text>
              <Text style={[s.statValue, { color: p.text }]}>
                {t('perDayValue', { value: num(stats.avg), unit })}
                {meter.pricePerUnit !== null ? ` · ${money(cost(stats.avg, meter.pricePerUnit))}` : ''}
              </Text>
            </View>
            {stats.next30 !== null ? (
              <View style={[s.statRow, { borderTopColor: p.border }]}>
                <Text style={[s.statLabel, { color: p.muted }]}>{t('next30')}</Text>
                <Text style={[s.statValue, { color: p.text }]}>
                  {num(stats.next30)} {unit}
                  {meter.pricePerUnit !== null ? ` · ${money(cost(stats.next30, meter.pricePerUnit))}` : ''}
                </Text>
              </View>
            ) : null}
          </Section>
        ) : readings.length === 1 ? (
          <Text style={[s.hint, { color: p.muted }]}>{t('oneReadingHint')}</Text>
        ) : null}

        {stats.months.some((m) => m.amount > 0) ? (
          <Section title={t('monthly')}>
            <MonthlyChart months={stats.months} unit={unit} partialNote={t('partialMonth')} />
          </Section>
        ) : null}

        <Section title={t('readings')}>
          {readings.length === 0 ? (
            <Text style={[s.hint, s.pad, { color: p.muted }]}>{t('noReadings')}</Text>
          ) : (
            [...readings].reverse().map((r, i) => {
              const iv = stats.byReading.get(r.id);
              return (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/reading', params: { meterId: String(meter.id), id: String(r.id) } })
                  }
                  onLongPress={() =>
                    confirmDelete(
                      t('deleteReading'),
                      t('deleteReadingBody', { value: `${formatNumber(r.value, locale, 3)} ${unit}`, date: formatDay(r.date, locale) }),
                      () => store.deleteReading(r.id),
                    )
                  }
                  style={({ pressed }) => [
                    s.reading,
                    { borderTopColor: p.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <View style={s.readingMain}>
                    <Text style={[s.readingValue, { color: p.text }]}>
                      {formatNumber(r.value, locale, 3)} {unit}
                    </Text>
                    <Text style={[s.small, { color: p.muted }]}>{formatDay(r.date, locale)}</Text>
                  </View>
                  <View style={s.readingSide}>
                    {iv ? (
                      <Text style={[s.delta, { color: p.text }]}>
                        {t('since', { value: num(iv.amount), unit, days: iv.days })}
                      </Text>
                    ) : null}
                    {r.reset ? (
                      <View style={s.resetTag}>
                        <MaterialIcons name="restart-alt" size={14} color={p.muted} />
                        <Text style={[s.small, { color: p.muted }]}>{t('newSeries')}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 4 },
  headerButtons: { flexDirection: 'row' },
  addButton: { marginBottom: 16 },
  statBlock: { padding: 14, gap: 4 },
  bigValue: { fontSize: 28, fontWeight: '700' },
  bigCost: { fontSize: 20, fontWeight: '600' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18 },
  hint: { fontSize: 15, lineHeight: 21, marginVertical: 12 },
  pad: { paddingHorizontal: 14 },
  reading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  readingMain: { flex: 1, gap: 2 },
  readingValue: { fontSize: 16, fontWeight: '600' },
  readingSide: { alignItems: 'flex-end', gap: 2 },
  delta: { fontSize: 14 },
  resetTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
