import PayslipDetailsPage from '@/features/payslip/components/payslip-details'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/payslip/$PayslipId/',
)({
  component: PayslipDetailsPage,
})
