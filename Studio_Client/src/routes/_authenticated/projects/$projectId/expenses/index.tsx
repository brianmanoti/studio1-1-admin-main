import Expenses from '@/features/expenses'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/expenses/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Expenses/></div>
}
