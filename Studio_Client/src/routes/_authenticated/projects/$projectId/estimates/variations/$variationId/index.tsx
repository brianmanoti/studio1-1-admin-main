import VariationDetailPage from '@/features/estimates/variations/components/variations-view'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/estimates/variations/$variationId/',
)({
  component: VariationDetailPage,
})


