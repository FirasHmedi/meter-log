import { useState } from 'react';
import { type LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { locale } from '@/i18n';
import type { MonthTotal } from '@/lib/consumption';
import { formatNumber } from '@/lib/format';

import { usePalette } from './theme';

const HEIGHT = 180;
const TOP = 18;
const BOTTOM = 22;
const FONT = Platform.OS === 'web' ? 'sans-serif' : undefined;

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'narrow' }).format(new Date(y, m - 1, 15));
}

/** Bar chart drawn by hand with react-native-svg. */
export function MonthlyChart({ months, unit, partialNote }: { months: MonthTotal[]; unit: string; partialNote: string }) {
  const p = usePalette();
  const [width, setWidth] = useState(0);
  const max = Math.max(...months.map((m) => m.amount), 0);
  const plotH = HEIGHT - TOP - BOTTOM;
  const slot = months.length > 0 ? width / months.length : 0;
  const barW = Math.max(4, slot * 0.62);
  const hasPartial = months.some((m) => m.coveredDays > 0 && m.coveredDays < m.daysInMonth);
  const peak = months.reduce((best, m, i) => (m.amount > (months[best]?.amount ?? -1) ? i : best), 0);

  const summary = months
    .filter((m) => m.amount > 0)
    .map((m) => `${m.month}: ${formatNumber(m.amount, locale)} ${unit}`)
    .join(', ');

  return (
    <View style={chart.wrap} accessible accessibilityLabel={summary}>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Line x1={0} x2={width} y1={TOP + plotH} y2={TOP + plotH} stroke={p.border} strokeWidth={1} />
            {months.map((m, i) => {
              const h = max > 0 ? (m.amount / max) * plotH : 0;
              const x = i * slot + (slot - barW) / 2;
              const partial = m.coveredDays < m.daysInMonth;
              return (
                <Rect
                  key={m.month}
                  x={x}
                  y={TOP + plotH - h}
                  width={barW}
                  height={Math.max(h, m.amount > 0 ? 1 : 0)}
                  rx={3}
                  fill={partial ? p.accentSoft : p.accent}
                />
              );
            })}
            {max > 0 ? (
              <SvgText
                x={Math.min(Math.max(peak * slot + slot / 2, 24), width - 24)}
                y={TOP - 5 + plotH - (months[peak].amount / max) * plotH}
                fontSize={11}
                fontFamily={FONT}
                fill={p.muted}
                textAnchor="middle"
              >
                {formatNumber(months[peak].amount, locale)}
              </SvgText>
            ) : null}
            {months.map((m, i) => (
              <SvgText key={`l${m.month}`} x={i * slot + slot / 2} y={HEIGHT - 6} fontSize={11} fontFamily={FONT} fill={p.muted} textAnchor="middle">
                {monthLabel(m.month)}
              </SvgText>
            ))}
          </Svg>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>
      <Text style={[chart.note, { color: p.muted }]}>
        {unit}
        {hasPartial ? ` · ${partialNote}` : ''}
      </Text>
    </View>
  );
}

const chart = StyleSheet.create({
  wrap: { padding: 12 },
  note: { fontSize: 12, marginTop: 4, lineHeight: 17 },
});
