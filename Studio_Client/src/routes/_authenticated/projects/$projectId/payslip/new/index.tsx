import PayslipForm from '@/features/payslip/components/payslip-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/payslip/new/',
)({
  component: PayslipForm,
})
