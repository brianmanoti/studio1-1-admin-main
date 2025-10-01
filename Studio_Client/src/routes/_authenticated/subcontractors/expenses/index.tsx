import { ExpensesTable } from '@/features/subcontractors/expenses/expenses-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/subcontractors/expenses/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><ExpensesTable /></div>
}
