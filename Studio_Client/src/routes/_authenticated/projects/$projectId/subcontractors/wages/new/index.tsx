import SubWageOrderForm from '@/features/subcontractors/wages/componets/sub-Wage-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/wages/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      < SubWageOrderForm />
    </>
  )
}
