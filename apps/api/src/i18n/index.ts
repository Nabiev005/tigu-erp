import type { Locale } from '@tigu/shared';
import ky from './ky.json';
import ru from './ru.json';

const messages = { ky, ru } as const;
export type MessageKey = keyof typeof ky;

/** Server-side messages (SMS, Telegram, PDF) in the recipient's language (spec §12). */
export function message(
  locale: Locale,
  key: MessageKey,
  vars: Record<string, string> = {},
): string {
  return messages[locale][key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => vars[name] ?? '');
}
