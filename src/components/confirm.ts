import { Alert, Platform } from 'react-native';

import { t } from '@/i18n';

/** Asks before a destructive action. */
export function confirmDelete(title: string, message: string, onConfirm: () => void): void {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: t('cancel'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(message: string): void {
  if (Platform.OS === 'web') globalThis.alert?.(message);
  else Alert.alert('', message);
}
