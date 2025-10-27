import { ItemsTable } from '@/features/items/components/items-table'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/items/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <><ItemsTable /></>
}
