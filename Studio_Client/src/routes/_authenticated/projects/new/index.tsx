import ProjectForm from '@/features/projects/components/projects-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/new/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <><ProjectForm redirectOnSuccess />
</>
}
