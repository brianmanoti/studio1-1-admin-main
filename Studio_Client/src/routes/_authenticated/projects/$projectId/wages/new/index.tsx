import WageOrderForm from '@/features/wages/componets/Wages-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/wages/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <><WageOrderForm />
  </>
}
