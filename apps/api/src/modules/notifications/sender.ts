import { maskPhone, type OtpChannel } from '@tigu/shared';
import type { FastifyBaseLogger } from 'fastify';

export interface OutgoingMessage {
  phone: string;
  channel: OtpChannel;
  text: string;
  telegramChatId?: string | null;
}

/**
 * Delivers codes, PINs and passwords by SMS or Telegram (spec §14).
 * Real providers (SMS gateway, grammY bot) plug in here; dev prints to the console.
 */
export interface MessageSender {
  send(message: OutgoingMessage): Promise<void>;
}

export class ConsoleMessageSender implements MessageSender {
  constructor(private readonly log: FastifyBaseLogger) {}

  async send({ phone, channel, text }: OutgoingMessage): Promise<void> {
    this.log.info({ to: maskPhone(phone), channel }, `[dev sender] ${text}`);
  }
}

/** Keeps messages in memory — used by tests to read the code that was "sent". */
export class MemoryMessageSender implements MessageSender {
  readonly sent: OutgoingMessage[] = [];

  async send(message: OutgoingMessage): Promise<void> {
    this.sent.push(message);
  }

  last(phone: string): OutgoingMessage | undefined {
    return this.sent.filter((m) => m.phone === phone).at(-1);
  }

  /** Extracts the last 4–6 digit number sent to `phone`. */
  lastCode(phone: string): string {
    const text = this.last(phone)?.text ?? '';
    const match = /(\d{4,6})(?!.*\d{4,6})/.exec(text);
    if (!match?.[1]) throw new Error(`No code sent to ${phone}`);
    return match[1];
  }
}
