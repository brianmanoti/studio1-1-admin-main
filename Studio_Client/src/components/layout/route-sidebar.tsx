import { useMatchRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ProjectSidebar } from './projects-sidebar'


export function RouteSidebar() {
  const match = useMatchRoute()

  const isProjectRoute = match({ to: '/projects/$projectId', fuzzy: true })

  if (isProjectRoute) return <ProjectSidebar />
  return <AppSidebar />
}
