import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { confirmDelete } from '@/components/confirm';
import { FormScreen } from '@/components/FormScreen';
import { KIND_ICONS, usePalette } from '@/components/theme';
import { Button, Field, Input } from '@/components/ui';
import { useStore } from '@/data/store';
import { currency, locale, t } from '@/i18n';
import { formatNumber, parseDecimal } from '@/lib/format';
import { defaultUnit, METER_KINDS, type MeterKind, resolveUnit } from '@/lib/meters';

export default function MeterEditScreen() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useStore();
  const existing = id ? store.meters.find((m) => m.id === Number(id)) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<MeterKind>(existing?.kind ?? 'electricity');
  const [customUnit, setCustomUnit] = useState(existing?.kind === 'custom' ? existing.unit : '');
  const [price, setPrice] = useState(
    existing?.pricePerUnit != null ? formatNumber(existing.pricePerUnit, locale, 6).replace(/[\s  ]/g, '') : '',
  );
  const [errors, setErrors] = useState<{ name?: string; unit?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);

  const unit = resolveUnit(kind, customUnit);

  async function save() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('errorName');
    if (!unit) next.unit = t('errorUnit');
    const priceValue = price.trim() === '' ? null : parseDecimal(price);
    if (priceValue !== null && (Number.isNaN(priceValue) || priceValue < 0)) next.price = t('errorPrice');
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    const input = { name: name.trim(), kind, unit, pricePerUnit: priceValue };
    try {
      if (existing) {
        await store.updateMeter(existing.id, input);
        router.back();
      } else {
        const newId = await store.addMeter(input);
        router.replace({ pathname: '/meter/[id]', params: { id: String(newId) } });
      }
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!existing) return;
    const count = store.readings.filter((r) => r.meterId === existing.id).length;
    confirmDelete(t('deleteMeter'), t('deleteMeterBody', { count }), async () => {
      await store.deleteMeter(existing.id);
      router.dismissTo('/');
    });
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: existing ? t('editMeter') : t('newMeter') }} />
      <Field label={t('name')} error={errors.name}>
        <Input testID="meter-name" value={name} onChangeText={setName} placeholder={t('namePlaceholder')} maxLength={60} autoFocus={!existing} />
      </Field>

      <Field label={t('type')}>
        <View style={s.kinds} accessibilityRole="radiogroup">
          {METER_KINDS.map((k) => {
            const selected = k === kind;
            return (
              <Pressable
                key={k}
                testID={`kind-${k}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setKind(k)}
                style={[s.kind, { borderColor: selected ? p.accent : p.border, backgroundColor: selected ? p.accent : p.surface }]}
              >
                <MaterialIcons name={KIND_ICONS[k]} size={20} color={selected ? p.accentText : p.accent} />
                <Text style={[s.kindText, { color: selected ? p.accentText : p.text }]}>
                  {t(`kind_${k}`)}
                  {k !== 'custom' ? ` (${defaultUnit(k)})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      {kind === 'custom' ? (
        <Field label={t('unit')} error={errors.unit}>
          <Input value={customUnit} onChangeText={setCustomUnit} placeholder={t('unitPlaceholder')} maxLength={12} />
        </Field>
      ) : null}

      <Field label={t('pricePerUnit', { unit: unit || '…' })} hint={t('priceHint', { currency })} error={errors.price}>
        <Input testID="meter-price" value={price} onChangeText={setPrice} placeholder={t('pricePlaceholder')} keyboardType="decimal-pad" />
      </Field>

      <View style={s.actions}>
        <Button testID="save" label={t('save')} icon="check" onPress={save} disabled={saving} />
        {existing ? <Button label={t('delete')} icon="delete-outline" variant="danger" onPress={remove} /> : null}
      </View>
    </FormScreen>
  );
}

const s = StyleSheet.create({
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, minHeight: 44 },
  kindText: { fontSize: 15, fontWeight: '500' },
  actions: { gap: 12, marginTop: 8 },
});
