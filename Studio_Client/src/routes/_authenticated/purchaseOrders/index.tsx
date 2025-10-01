import { PurchaseOrdersTable } from '@/features/purchase-orders/purchaseOrders-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/purchaseOrders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PurchaseOrdersTable /></div>
}
