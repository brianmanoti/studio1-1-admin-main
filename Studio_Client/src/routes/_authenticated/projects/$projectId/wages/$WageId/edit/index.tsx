import WageOrderForm from '@/features/wages/componets/Wages-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/wages/$WageId/edit/',
)({
  component: RouteComponent,
})

function RouteComponent() {
    const wageId = Route.useParams().WageId

     return <WageOrderForm wageId={wageId} />
}
