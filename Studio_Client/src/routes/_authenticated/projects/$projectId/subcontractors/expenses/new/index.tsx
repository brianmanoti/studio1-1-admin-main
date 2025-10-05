import SubExpenseForm from '@/features/subcontractors/expenses/components/sub-expense-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/expenses/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      < SubExpenseForm />
    </>
  )
}
