import PurchaseOrderForm from '@/features/purchase-orders/components/purchase-Order-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/purchaseOrders/$purchaseId/edit/',
)({
  component: RouteComponent,
})

function RouteComponent() {
    const purchaseId = Route.useParams().purchaseId
  return <PurchaseOrderForm purchaseOrderId={purchaseId} />
}
