import PurchaseOrders from '@/features/purchase-orders'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/purchaseOrders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PurchaseOrders /></div>
}
