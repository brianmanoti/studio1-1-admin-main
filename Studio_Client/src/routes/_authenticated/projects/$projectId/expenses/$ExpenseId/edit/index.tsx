import ExpenseForm from '@/features/expenses/components/new/expenses-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/expenses/$ExpenseId/edit/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { ExpenseId } = Route.useParams()
  return  <ExpenseForm ExpenseId={ ExpenseId} />
}
