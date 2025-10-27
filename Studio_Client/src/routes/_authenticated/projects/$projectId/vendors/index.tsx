import Vendors from '@/features/vendors'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/vendors/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <><Vendors /></>
}
