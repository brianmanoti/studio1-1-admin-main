import Subcontractors from '@/features/subcontractors/subcontractors'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/Subcontractors/',
)({
  component: Subcontractors,
})