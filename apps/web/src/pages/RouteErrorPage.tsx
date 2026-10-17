import { useRouteError } from 'react-router-dom';
import { ErrorState } from '../shared/ui';

/** Fallback for errors thrown while rendering or loading a route. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    </div>
  );
}
