import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { providerFuture, routerFuture } from './router/future';
import { FullScreenLoader } from './router/guards';
import { routes } from './router/routes';

const router = createBrowserRouter(routes, { future: routerFuture });

export function App() {
  return (
    <AppProviders>
      <RouterProvider
        router={router}
        future={providerFuture}
        fallbackElement={<FullScreenLoader />}
      />
    </AppProviders>
  );
}
