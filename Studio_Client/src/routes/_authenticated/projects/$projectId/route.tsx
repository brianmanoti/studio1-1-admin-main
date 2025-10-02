import { createFileRoute } from '@tanstack/react-router'
import { ProjectsLayout } from '@/components/layout/projects-layout'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectsLayout,
})
