import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/wages/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>This is the wages page</div>
}
