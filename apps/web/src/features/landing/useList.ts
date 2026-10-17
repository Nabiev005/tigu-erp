import { useTranslation } from 'react-i18next';

/** Reads an array from the translation files (e.g. FAQ items). */
export function useList<T>(key: string): T[] {
  const { t } = useTranslation();
  const value: unknown = t(key, { returnObjects: true });
  return Array.isArray(value) ? (value as T[]) : [];
}
