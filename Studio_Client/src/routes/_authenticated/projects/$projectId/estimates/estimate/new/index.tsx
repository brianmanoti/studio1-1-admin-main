import EstimateForm from '@/features/estimates/estimates/components/estimate-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/estimates/estimate/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
    <EstimateForm />
    </div>
  )
}
