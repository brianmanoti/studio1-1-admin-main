import Variations from '@/features/estimates'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId/estimates/variations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Variations /></div>
}
