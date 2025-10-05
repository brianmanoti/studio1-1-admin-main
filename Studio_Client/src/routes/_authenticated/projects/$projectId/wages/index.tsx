import { createFileRoute } from '@tanstack/react-router'
import Wages from '@/features/wages'

function RouteComponent() {
  return <Wages />
}

export const Route = createFileRoute('/_authenticated/projects/$projectId/wages/')({
  component: RouteComponent,
})

