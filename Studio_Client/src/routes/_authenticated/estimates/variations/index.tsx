import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/estimates/variations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/estimates/variations/"!</div>
}
