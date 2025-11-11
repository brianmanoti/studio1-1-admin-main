import VendorForm from '@/features/vendors/components/vendors-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/vendors/new/',
)({
  component: VendorForm,
})


