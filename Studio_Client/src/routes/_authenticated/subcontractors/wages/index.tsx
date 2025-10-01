import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/subcontractors/wages/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>This Is the subcontactor wages</div>
}
