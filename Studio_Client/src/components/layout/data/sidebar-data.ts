import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  ShieldCheck,
  PieChartIcon,
  DollarSignIcon,
  CreditCardIcon,
  ListOrderedIcon,
  HardHatIcon,
  TrendingDownIcon,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {

  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/projects/$projectId',
          icon: LayoutDashboard,
        },
        {
          title: 'Budget',
          url: `/projects/$projectId/budget`,
          icon: PieChartIcon,
        },
        {
          title: 'Estimates',
          icon: TrendingDownIcon,
          items: [
            {
              title: 'Estimate',
              url: '/projects/$projectId/estimates/estimate',
            },
            {
              title: 'Variations',
              url: '/projects/$projectId/estimates/variations',
            },
          ],
        },
        {
          title: 'Purchase Orders',
          url: '/projects/$projectId/purchaseOrders',
          icon: ListTodo,
        },
        {
          title: 'Wages',
          url: '/projects/$projectId/wages',
          icon: ListOrderedIcon,
        },
        {
          title: 'Expenses',
          url: '/projects/$projectId/expenses',
          icon: DollarSignIcon,
        },
          {
          title: 'Subcontractors',
          icon: HardHatIcon,
          items: [
            {
              title: 'Wages',
              url: '/projects/$projectId/subcontractors/wages',
            },
            {
              title: 'Purchase Orders',
              url: '/projects/$projectId/subcontractors/purchase-orders',
            },
            {
              title: 'Expenses',
              url: '/projects/$projectId/subcontractors/expenses',
            },
          ],
        },
        {
          title: 'Payroll',
          url: '/projects/$projectId/payslip',
          badge: '3',
          icon: CreditCardIcon,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Admin',
          icon: ShieldCheck,
          items: [
            {
              title: 'Items',
              url: '/projects/$projectId/items',
            },
            {
              title: 'Sign In',
              url: '/clerk/sign-in',
            },
            {
              title: 'Sign Up',
              url: '/clerk/sign-up',
            },
            {
              title: 'User Management',
              url: '/clerk/user-management',
            },
          ],
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
