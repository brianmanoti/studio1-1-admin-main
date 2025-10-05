import ExpenseForm from '@/features/expenses/components/new/expenses-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/expenses/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <>< ExpenseForm /> </>
}
