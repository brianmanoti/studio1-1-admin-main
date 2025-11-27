'use client'

import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'

import { useNavigate, useParams } from '@tanstack/react-router'
import { useProjectStore } from '@/stores/projectStore'

interface Project {
  _id: string
  name: string
  client?: {
    companyName: string
  }
}

interface ProjectsSwitcherProps {
  projects?: Project[]
  isLoading?: boolean
  isError?: boolean
}

export function ProjectsSwitcher({
  projects = [],
  isLoading,
  isError,
}: ProjectsSwitcherProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { id?: string }
  const setProjectId = useProjectStore((s) => s.setProjectId)

  /* -----------------------------------------------------------
     🎯 COMPUTE ACTIVE PROJECT (NO duplicated state)
  ----------------------------------------------------------- */
  const activeProject = React.useMemo(() => {
    if (projects.length === 0) return null
    return projects.find((p) => p._id === params.id) || projects[0]
  }, [projects, params.id])

  /* -----------------------------------------------------------
     🔄 SYNC GLOBAL STORE WHEN ACTIVE PROJECT CHANGES
  ----------------------------------------------------------- */
  React.useEffect(() => {
    if (activeProject?._id) {
      setProjectId(activeProject._id)
    }
  }, [activeProject, setProjectId])

  /* -----------------------------------------------------------
     🧭 SELECT PROJECT HANDLER
  ----------------------------------------------------------- */
  const handleSelectProject = React.useCallback(
    (project: Project) => {
      setProjectId(project._id)
      navigate({ to: '/projects/$id', params: { id: project._id } })
    },
    [setProjectId, navigate]
  )

  /* -----------------------------------------------------------
     📦 RENDER: Loading / Error / Empty
  ----------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-8 w-8 bg-muted rounded-full" />
        <div className="flex flex-col gap-1">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-2 w-16 bg-muted/60 rounded" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load projects.</p>
  }

  if (projects.length === 0) {
    return (
      <p
        className="text-gray-500 cursor-pointer hover:text-blue-600 transition"
        onClick={() => navigate({ to: '/projects/new' })}
      >
        No projects found — click to create one!
      </p>
    )
  }

  /* -----------------------------------------------------------
     🎨 MAIN UI
  ----------------------------------------------------------- */
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center gap-2">
                {/* Avatar Circle */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  {activeProject?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>

                {/* Title + Company */}
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeProject?.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeProject?.client?.companyName}
                  </span>
                </div>
              </div>

              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Projects
            </DropdownMenuLabel>

            {/* Project List */}
            {projects.map((project) => (
              <DropdownMenuItem
                key={project._id}
                className="gap-2 p-2"
                onClick={() => handleSelectProject(project)}
              >
                {project.name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Add New Project */}
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer hover:bg-blue-50 transition"
              onClick={() => navigate({ to: '/projects/new' })}
            >
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4 text-blue-600" />
              </div>
              <span className="text-blue-600 font-medium">Add Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
