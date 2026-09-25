import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";
import {
  parseSetting,
  settingDefaults,
  type SettingKey,
  type SettingValue,
} from "@/validation/settings";

/**
 * All settings in one query per request. Missing keys fall back to defaults;
 * a database failure also falls back (logged) so the shell can still render.
 */
export const getSettings = cache(async (): Promise<{ [K in SettingKey]: SettingValue<K> }> => {
  const values = { ...settingDefaults };
  try {
    const rows = await db.siteSetting.findMany();
    for (const row of rows) {
      if (row.key in values) {
        const key = row.key as SettingKey;
        (values as Record<SettingKey, unknown>)[key] = parseSetting(key, row.value);
      }
    }
  } catch (error) {
    console.error("[settings] Falling back to defaults:", error);
  }
  return values;
});

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const settings = await getSettings();
  return settings[key];
}
