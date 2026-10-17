import { OtpChannelSchema, type OtpChannel } from '@tigu/shared';
import { MessageSquare, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../shared/lib/cn';

const ICONS = { telegram: Send, sms: MessageSquare } as const;

export function ChannelPicker({
  value,
  onChange,
}: {
  value: OtpChannel;
  onChange: (value: OtpChannel) => void;
}) {
  const { t } = useTranslation();
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-body font-medium text-body-2">{t('auth.channel.label')}</legend>
      <div className="grid grid-cols-2 gap-2">
        {OtpChannelSchema.options.map((channel) => {
          const Icon = ICONS[channel];
          const checked = channel === value;
          return (
            <label
              key={channel}
              className={cn(
                'flex h-control cursor-pointer items-center justify-center gap-2 rounded-control border text-body font-medium',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
                checked
                  ? 'border-primary bg-primary-soft text-primary-dark'
                  : 'border-line bg-surface',
              )}
            >
              <input
                type="radio"
                name="otp-channel"
                value={channel}
                checked={checked}
                onChange={() => onChange(channel)}
                className="sr-only"
              />
              <Icon className="size-4" aria-hidden="true" />
              {t(`auth.channel.${channel}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
