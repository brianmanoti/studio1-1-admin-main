import { WagesTable } from '@/features/wages/componets/wages-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/wages/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><WagesTable /></div>
}
