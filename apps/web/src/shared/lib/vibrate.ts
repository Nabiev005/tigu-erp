/** Haptic feedback: one pulse on success, two on error (spec §11.7). No-op where unsupported. */
export function vibrate(kind: 'success' | 'error' = 'success'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(kind === 'success' ? 200 : [120, 80, 120]);
}
