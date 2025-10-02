import SubExpenses from '@/features/subcontractors/expenses'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/expenses/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><SubExpenses /></div>
}
