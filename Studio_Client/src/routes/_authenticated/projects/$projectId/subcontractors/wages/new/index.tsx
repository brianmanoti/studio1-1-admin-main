
import SubcontractorWagesForm from '@/features/subcontractors/wages/componets/subcontractor-wages-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/wages/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      < SubcontractorWagesForm />
    </>
  )
}
