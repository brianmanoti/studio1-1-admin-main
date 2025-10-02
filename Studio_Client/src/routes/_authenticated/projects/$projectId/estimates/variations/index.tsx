import { VariationTable } from '@/features/estimates/variations/variations-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/estimates/variations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><VariationTable /></div>
}
