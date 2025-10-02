import VariationForm from '@/features/estimates/variations/forms/variations-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/estimates/variations/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
    <VariationForm />
    </>
  )
}
