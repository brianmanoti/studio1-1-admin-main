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
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Budget',
          url: '/budget',
          icon: PieChartIcon,
        },
        {
          title: 'Estimates',
          icon: TrendingDownIcon,
          items: [
            {
              title: 'Estimate',
              url: '/estimates/estimate',
            },
            {
              title: 'Variations',
              url: '/estimates/variations',
            },
          ],
        },
        {
          title: 'Purchase Orders',
          url: '/purchaseOrders',
          icon: ListTodo,
        },
        {
          title: 'Wages',
          url: '/wages',
          icon: ListOrderedIcon,
        },
        {
          title: 'Expenses',
          url: '/expenses',
          icon: DollarSignIcon,
        },
          {
          title: 'Subcontractors',
          icon: HardHatIcon,
          items: [
            {
              title: 'Wages',
              url: '/subcontractors/wages',
            },
            {
              title: 'Purchase Orders',
              url: '/subcontractors/purchase-orders',
            },
            {
              title: 'Expenses',
              url: '/subcontractors/expenses',
            },
          ],
        },
        {
          title: 'Payroll',
          url: '/payslip',
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
