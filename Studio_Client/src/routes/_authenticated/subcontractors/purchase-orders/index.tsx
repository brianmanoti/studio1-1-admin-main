import { PurchaseOrdersTable } from '@/features/subcontractors/purchase-orders/purchaseOrders-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/subcontractors/purchase-orders/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PurchaseOrdersTable /></div>
}
