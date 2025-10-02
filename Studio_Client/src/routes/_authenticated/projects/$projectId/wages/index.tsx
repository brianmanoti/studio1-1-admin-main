import Wages from '@/features/wages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/wages/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Wages /></div>
}
