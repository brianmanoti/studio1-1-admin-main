import BudgetView from '@/features/budget/components/budget'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/budget/')({
  component: BudgetView,
})
