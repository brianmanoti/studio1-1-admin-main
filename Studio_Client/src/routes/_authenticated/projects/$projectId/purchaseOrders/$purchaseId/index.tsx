import POViewPage from '@/features/purchase-orders/components/viewPo'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/purchaseOrders/$purchaseId/',
)({
  component: POViewPage,
})


