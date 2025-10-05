import PurchaseOrderForm from '@/features/subcontractors/purchase-orders/components/purchaseOrder-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/subcontractors/purchase-orders/new/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
    <PurchaseOrderForm />

    </>
  )
}
