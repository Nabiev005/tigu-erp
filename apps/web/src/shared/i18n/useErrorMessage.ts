import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError } from '../api/types';

/** Turns any thrown value into a translated, user-facing message. */
export function useErrorMessage(): (error: unknown) => string {
  const { t, i18n } = useTranslation();
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiClientError) {
        const key = `errors.${error.code}`;
        return i18n.exists(key) ? t(key, error.details ?? {}) : t('errors.UNKNOWN');
      }
      return t('errors.UNKNOWN');
    },
    [t, i18n],
  );
}

/** Translates a zod/react-hook-form message that holds an i18n key (e.g. "validation.phone"). */
export function useFieldError(): (message: string | undefined) => string | undefined {
  const { t, i18n } = useTranslation();
  return useCallback(
    (message: string | undefined) => {
      if (!message) return undefined;
      return i18n.exists(message) ? t(message) : t('validation.required');
    },
    [t, i18n],
  );
}
