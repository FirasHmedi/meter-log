import { Platform } from 'react-native';
import { requestPinWidget, requestWidgetUpdate } from 'react-native-android-widget';

import type { Snapshot } from '@/data/types';

import { WIDGET_NAME } from './LogReadingWidget';
import { renderLogReading } from './render';

export const widgetsAvailable = Platform.OS === 'android';

/** Redraws the widgets on the home screen after the data changed. Never throws. */
export function updateWidgets(snapshot: Pick<Snapshot, 'meters' | 'readings'>): void {
  if (!widgetsAvailable) return;
  requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: () => renderLogReading(snapshot) }).catch(() => undefined);
}

/** Opens the launcher's "add widget" prompt. False when the launcher does not support it. */
export async function pinWidget(): Promise<boolean> {
  if (!widgetsAvailable) return false;
  try {
    return await requestPinWidget({ widgetName: WIDGET_NAME });
  } catch {
    return false;
  }
}
