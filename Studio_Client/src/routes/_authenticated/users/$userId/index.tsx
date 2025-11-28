import { ErrorBoundary } from '@/features/users/components/permissions/ErrorBoundary';
import { UserPermissionsPage } from '@/features/users/components/permissions/UserPermissionsPage';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/users/$userId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ErrorBoundary>
      <UserPermissionsPage />
    </ErrorBoundary>
  );
}
