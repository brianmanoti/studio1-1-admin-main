import { useMatchRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ProjectSidebar } from './projects-sidebar'

export function RouteSidebar() {
  const match = useMatchRoute()

  // Detect dynamic project route
  const isProjectRoute = match({ to: '/projects/$projectId', fuzzy: true })

  // Detect excluded routes
  const isNewProject = match({ to: '/projects/new', fuzzy: true })
  const isEditProject = match({ to: '/projects/$projectId/edit', fuzzy: true })

  // Only show project sidebar for REAL project IDs
  if (isProjectRoute && !isNewProject && !isEditProject) {
    return <ProjectSidebar />
  }

  return <AppSidebar />
}
