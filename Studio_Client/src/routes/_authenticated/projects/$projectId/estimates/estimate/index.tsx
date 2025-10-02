import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/estimates/estimate/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/estimates/estimate/"!</div>
}
