import { WagesTable } from '@/features/subcontractors/wages/componets/wages-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/subcontractors/wages/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><WagesTable /></div>
}
