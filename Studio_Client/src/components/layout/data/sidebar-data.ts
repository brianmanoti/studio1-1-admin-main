import {
  LayoutDashboard,
  ListTodo,
  PieChartIcon,
  DollarSignIcon,
  ListOrderedIcon,
  HardHatIcon,
  TrendingDownIcon,
  ProjectorIcon,
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
          title: 'Projects',
          url: '/',
          icon: ProjectorIcon,
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
      ],
    },
  ],
}
