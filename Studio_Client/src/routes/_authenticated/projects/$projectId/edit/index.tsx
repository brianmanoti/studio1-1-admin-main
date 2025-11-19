import EditProjectPage from '@/features/projects/components/EditProjectPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/edit/',
)({
  component: EditProjectPage,
})
