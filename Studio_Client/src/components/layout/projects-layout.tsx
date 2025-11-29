import { Outlet, useParams } from '@tanstack/react-router'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { useProjectStore } from '@/stores/projectStore'
import { useEffect } from 'react'
import { ProjectDebug } from '../debug'
import { ItemsVendorsProvider } from '@/contexts/items-vendors-context'

type ProjectsLayoutProps = {
  children?: React.ReactNode
}

export function ProjectsLayout({ children }: ProjectsLayoutProps) {
  // Read projectId from URL if available
  let projectId: string | null = null

  try {
    const params = useParams({ strict: false }) as { projectId?: string }
    projectId = params?.projectId ?? null
  } catch {
    projectId = null
  }

  // Zustand store
  const setProjectId = useProjectStore((state) => state.setProjectId)

  // Sync projectId to Zustand
  useEffect(() => {
    setProjectId(projectId ?? null)
    return () => setProjectId(null)
  }, [projectId, setProjectId])

  return (
    <SearchProvider>
      <LayoutProvider>
        <ItemsVendorsProvider>
          <ProjectDebug />

          {/* The actual page content */}
          {children ?? <Outlet />}
        </ItemsVendorsProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
