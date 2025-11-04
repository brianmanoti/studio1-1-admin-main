import WageViewPage from '@/features/wages/componets/view-Wage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/wages/$WageId/',
)({
  component: WageViewPage,
})
