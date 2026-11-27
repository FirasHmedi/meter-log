import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { palettes } from '@/components/theme';
import { locale, t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { addReadingLink, daysSinceLabel, type WidgetRow } from '@/lib/widget';

export const WIDGET_NAME = 'LogReading';

type Hex = `#${string}`;

function when(days: number): string {
  const label = daysSinceLabel(days);
  if (label.key === 'today') return t('widgetToday');
  if (label.key === 'yesterday') return t('widgetYesterday');
  return t('widgetDaysAgo', { days: label.days });
}

/** Home-screen widget: last reading and days since, per meter; a tap opens the add-reading screen. */
export function LogReadingWidget({ rows, theme }: { rows: WidgetRow[]; theme: 'light' | 'dark' }) {
  const p = palettes[theme];
  const c = (v: string) => v as Hex;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: c(p.surface),
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <TextWidget text={t('widgetTitle')} style={{ fontSize: 14, fontWeight: '700', color: c(p.accent) }} />
      {rows.length === 0 ? (
        <TextWidget text={t('widgetNoMeters')} style={{ fontSize: 14, color: c(p.muted), marginTop: 8 }} />
      ) : (
        rows.map((row) => (
          <FlexWidget
            key={row.meterId}
            clickAction="OPEN_URI"
            clickActionData={{ uri: addReadingLink(row.meterId) }}
            style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
          >
            <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
              <TextWidget text={row.name} maxLines={1} truncate="END" style={{ fontSize: 15, fontWeight: '600', color: c(p.text) }} />
              <TextWidget
                text={
                  row.last
                    ? `${formatNumber(row.last.value, locale, 3)} ${row.unit} · ${when(row.last.daysSince)}`
                    : t('widgetNoReading')
                }
                maxLines={1}
                truncate="END"
                style={{ fontSize: 13, color: c(p.muted) }}
              />
            </FlexWidget>
            <FlexWidget
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c(p.accent),
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 8,
              }}
            >
              <TextWidget text="+" style={{ fontSize: 22, fontWeight: '700', color: c(p.accentText) }} />
            </FlexWidget>
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
