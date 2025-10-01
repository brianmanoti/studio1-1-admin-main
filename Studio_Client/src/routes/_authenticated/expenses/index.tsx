import { ExpensesTable } from '@/features/expenses/expenses-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/expenses/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><ExpensesTable /></div>
}
