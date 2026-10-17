import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppProviders } from '../app/providers/AppProviders';
import { createQueryClient } from '../app/providers/queryClient';
import { providerFuture, routerFuture } from '../app/router/future';
import { routes } from '../app/router/routes';

/** Renders the real route tree at `path` with fresh providers. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
  const user = userEvent.setup();
  const utils = render(
    <AppProviders queryClient={createQueryClient()}>
      <RouterProvider router={router} future={providerFuture} />
    </AppProviders>,
  );
  return { ...utils, router, user };
}
