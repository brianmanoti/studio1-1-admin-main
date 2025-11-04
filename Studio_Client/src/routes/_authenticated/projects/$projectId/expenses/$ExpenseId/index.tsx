import EXPViewPage from '@/features/expenses/components/Expense-View-Page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/expenses/$ExpenseId/',
)({
  component: EXPViewPage,
})

