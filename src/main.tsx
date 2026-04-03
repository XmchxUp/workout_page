import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import WorkoutsPage from '@/pages/workouts';
import '@/styles/index.css';

const routes = createBrowserRouter(
  [
    {
      path: '/',
      element: <WorkoutsPage />,
    },
    {
      path: '*',
      element: <WorkoutsPage />,
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={routes} />
    </HelmetProvider>
  </React.StrictMode>
);
