import Payslips from '@/features/payslip'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/payslip/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Payslips /></div>
}
