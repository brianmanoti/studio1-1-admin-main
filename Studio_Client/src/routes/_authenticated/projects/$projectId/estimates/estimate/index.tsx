import EstimateView from '@/features/estimates/estimates/components/Estimates-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/estimates/estimate/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <><EstimateView /></>
}
