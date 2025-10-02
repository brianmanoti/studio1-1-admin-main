import SubWages from '@/features/subcontractors/wages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/subcontractors/wages/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><SubWages /></div>
}
