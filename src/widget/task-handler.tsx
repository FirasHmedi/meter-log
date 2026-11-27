import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { repo } from '@/data/repo';

import { WIDGET_NAME } from './LogReadingWidget';
import { renderLogReading } from './render';

/** Runs in the background when Android adds, resizes or periodically updates the widget. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) return;
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(renderLogReading(await repo.load()));
      break;
    default:
      break;
  }
}
