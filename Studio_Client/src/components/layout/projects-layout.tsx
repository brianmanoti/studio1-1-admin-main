import { Outlet, useParams} from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { useProjectStore } from '@/stores/projectStore'
import { useEffect } from 'react'
import { ProjectDebug } from '../debug'


type ProjectsLayoutProps = {
  children?: React.ReactNode
}

export function ProjectsLayout({ children }: ProjectsLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'


  // ✅ Try reading params safely — may not exist on /projects
  let projectId: string | null = null

  try {
    // This will succeed only if the current route has a $projectId param
    const params = useParams({ strict: false }) as { projectId?: string }
    projectId = params?.projectId ?? null
  } catch {
    // Do nothing if no param (e.g. /projects route)
    projectId = null
  }

  // Zustand store
  const setProjectId = useProjectStore((state) => state.setProjectId)

  // Sync projectId from URL to Zustand
  useEffect(() => {
    setProjectId(projectId ?? null)
    return () => setProjectId(null) // Cleanup when layout unmounts
  }, [projectId, setProjectId])


  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              '@container/content',
              'has-[[data-layout=fixed]]:h-svh',
              'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <ProjectDebug />
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
