import { createFileRoute } from '@tanstack/react-router'
import ProjectList from '@/features/projects/projects-table'

export const Route = createFileRoute('/_authenticated/')({
  component: ProjectList,
})
