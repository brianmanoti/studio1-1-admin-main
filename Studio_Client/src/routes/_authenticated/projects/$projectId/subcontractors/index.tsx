import Subcontractors from '@/features/subcontractors/subcontractors'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <><Subcontractors /> </>
}
