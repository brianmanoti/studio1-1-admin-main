import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/subcontractors/expenses/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/subcontractors/expenses/"!</div>
}
