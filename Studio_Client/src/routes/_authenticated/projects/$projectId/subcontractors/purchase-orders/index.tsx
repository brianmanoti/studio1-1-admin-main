import SubPurchases from '@/features/subcontractors/purchase-orders'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/purchase-orders/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><SubPurchases /></div>
}
