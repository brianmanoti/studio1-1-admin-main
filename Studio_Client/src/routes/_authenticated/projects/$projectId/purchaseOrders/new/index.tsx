import PurchaseOrderForm from '@/features/purchase-orders/components/purchase-Order-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/purchaseOrders/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <><PurchaseOrderForm /></>
  )
}
