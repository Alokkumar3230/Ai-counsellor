import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CounsellorPage from './pages/CounsellorPage';
import UniversitiesPage from './pages/UniversitiesPage';
import ApplicationPage from './pages/ApplicationPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <LandingPage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Onboarding',
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    name: 'AI Counsellor',
    path: '/counsellor',
    element: <CounsellorPage />,
  },
  {
    name: 'Universities',
    path: '/universities',
    element: <UniversitiesPage />,
  },
  {
    name: 'Application',
    path: '/application',
    element: <ApplicationPage />,
  },
];

export default routes;
