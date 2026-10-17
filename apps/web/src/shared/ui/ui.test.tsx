import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ky from '../i18n/ky.json';
import { Button } from './Button';
import { FileDrop } from './FileDrop';
import { StatusBadge } from './StatusBadge';
import { Tabs } from './Tabs';
import { PinPad } from './worker/PinPad';

describe('Button', () => {
  it('shows a spinner and blocks clicks while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('StatusBadge', () => {
  it('renders the translated order status', () => {
    render(<StatusBadge status="SEWING" />);
    expect(screen.getByText(ky.orders.status.SEWING)).toHaveAttribute('data-status', 'SEWING');
  });
});

describe('PinPad', () => {
  function Harness({ onComplete }: { onComplete: (pin: string) => void }) {
    const [value, setValue] = useState('');
    return (
      <PinPad
        value={value}
        onChange={(next) => {
          setValue(next);
          if (next.length === 4) onComplete(next);
        }}
      />
    );
  }

  it('collects 4 digits from buttons and supports backspace', async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    for (const d of ['1', '9']) await userEvent.click(screen.getByRole('button', { name: d }));
    await userEvent.click(screen.getByRole('button', { name: ky.ui.pinPad.backspace }));
    for (const d of ['2', '3', '4']) await userEvent.click(screen.getByRole('button', { name: d }));
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('accepts the physical keyboard', async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await userEvent.keyboard('4321');
    expect(onComplete).toHaveBeenCalledWith('4321');
  });
});

describe('FileDrop', () => {
  it('rejects disallowed extensions and oversized files', async () => {
    const onChange = vi.fn();
    render(
      <FileDrop label="Files" accept={['.pdf']} maxSizeMb={1} files={[]} onChange={onChange} />,
    );
    const input = screen.getByLabelText('Files');
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, new File(['x'], 'photo.exe', { type: 'application/octet-stream' }));
    expect(screen.getByRole('alert')).toHaveTextContent(ky.validation.fileType);

    await user.upload(input, new File([new Uint8Array(2 * 1024 * 1024)], 'big.pdf'));
    expect(screen.getByRole('alert')).toHaveTextContent('1');

    await user.upload(input, new File(['ok'], 'spec.PDF'));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'spec.PDF' })]);
  });
});

describe('Tabs', () => {
  it('moves selection with arrow keys', async () => {
    function Harness() {
      const [value, setValue] = useState<'a' | 'b'>('a');
      return (
        <Tabs
          label="tabs"
          value={value}
          onChange={setValue}
          items={[
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B', count: 3 },
          ]}
        />
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: 'A' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /B/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /B/ })).toHaveFocus();
  });
});
