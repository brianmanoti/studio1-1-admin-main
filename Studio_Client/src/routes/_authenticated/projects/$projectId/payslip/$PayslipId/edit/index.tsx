import PayrollEditForm from '@/features/payslip/components/payroll-edit-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/payslip/$PayslipId/edit/',
)({
  component: PayrollEditForm,
})


