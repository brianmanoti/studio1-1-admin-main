import { PayslipTable } from '@/features/payslip/payslip-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/payslip/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PayslipTable /></div>
}
