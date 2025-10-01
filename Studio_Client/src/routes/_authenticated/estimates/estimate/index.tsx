import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/estimates/estimate/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/estimates/estimate/"!</div>
}
