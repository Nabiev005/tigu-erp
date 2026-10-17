import { FileText, UploadCloud, X } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

export interface FileDropProps {
  label: string;
  /** Allowed extensions, e.g. ['.pdf', '.jpg']. MIME is verified again on the server. */
  accept: readonly string[];
  maxSizeMb: number;
  multiple?: boolean;
  files: readonly File[];
  onChange: (files: File[]) => void;
  className?: string;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function FileDrop({
  label,
  accept,
  maxSizeMb,
  multiple = false,
  files,
  onChange,
  className,
}: FileDropProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const allowed = accept.map((a) => a.toLowerCase());
    const badType = incoming.find((f) => !allowed.includes(extensionOf(f.name)));
    if (badType) return setError(t('validation.fileType'));
    const tooBig = incoming.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (tooBig) return setError(t('validation.fileSize', { max: maxSizeMb }));
    setError(null);
    onChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-body font-medium text-body-2">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-2 rounded-card border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragging ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
          error && 'border-danger',
        )}
      >
        <UploadCloud className="size-6 text-muted" aria-hidden="true" />
        <p className="text-body">
          {t('ui.fileDrop.title')} {t('ui.fileDrop.or')}{' '}
          <label
            htmlFor={inputId}
            className="cursor-pointer font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t('ui.fileDrop.browse')}
          </label>
        </p>
        <p className="text-caption text-muted">
          {t('ui.fileDrop.hint', {
            types: accept.map((a) => a.slice(1).toUpperCase()).join(', '),
            max: maxSizeMb,
          })}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept.join(',')}
          multiple={multiple}
          aria-label={label}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      ) : null}
      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-control border border-line bg-surface px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-body">{file.name}</span>
              <span className="text-caption text-muted num">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={t('ui.fileDrop.remove', { name: file.name })}
                className="flex size-8 items-center justify-center rounded-control text-muted hover:bg-line-soft"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
