import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/ResetPassword';
import { Branches } from './pages/Branches';
import { Departments } from './pages/Departments';
import { Units } from './pages/Units';
import { Roles } from './pages/Roles';
import { Admins } from './pages/Admins';
import { Members } from './pages/Members';
import { Workforce } from './pages/Workforce';
import { Programs } from './pages/Programs';
import { FollowUp } from './pages/FollowUp';
import { SMS } from './pages/SMS';
import { Wallet } from './pages/Wallet';
import { Reports } from './pages/Reports';
import { Subscription } from './pages/Subscription';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { Finance } from './pages/Finance';
import { Analytics } from './pages/Analytics';

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: Onboarding
      },
      {
        path: '/onboarding',
        Component: Onboarding
      },
      {
        path: '/login',
        Component: Login
      },
      {
        path: '/reset-password',
        Component: ResetPassword
      },
      {
        path: '/dashboard',
        Component: Dashboard
      },
      {
        path: '/branches',
        Component: Branches
      },
      {
        path: '/departments',
        Component: Departments
      },
      {
        path: '/units',
        Component: Units
      },
      {
        path: '/roles',
        Component: Roles
      },
      {
        path: '/admins',
        Component: Admins
      },
      {
        path: '/members',
        Component: Members
      },
      {
        path: '/workforce',
        Component: Workforce
      },
      {
        path: '/programs',
        Component: Programs
      },
      {
        path: '/finance',
        Component: Finance
      },
      {
        path: '/analytics',
        Component: Analytics
      },
      {
        path: '/follow-up',
        Component: FollowUp
      },
      {
        path: '/sms',
        Component: SMS
      },
      {
        path: '/wallet',
        Component: Wallet
      },
      {
        path: '/reports',
        Component: Reports
      },
      {
        path: '/subscription',
        Component: Subscription
      },
      {
        path: '/profile',
        Component: Profile
      },
      {
        path: '*',
        Component: NotFound
      }
    ]
  }
]);