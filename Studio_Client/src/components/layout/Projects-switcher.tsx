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

import { useNavigate } from '@tanstack/react-router'
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

  const projectId = useProjectStore((s) => s.projectId)
  const setProjectId = useProjectStore((s) => s.setProjectId)

  /* -----------------------------------------------------------
     🎯 ACTIVE PROJECT — STORE IS THE SOURCE OF TRUTH
  ----------------------------------------------------------- */
  const activeProject = React.useMemo(() => {
    if (!projects.length) return null

    // 1. If store has a valid projectId
    if (projectId) {
      const found = projects.find((p) => p._id === projectId)
      if (found) return found
    }

    // 2. If store id is invalid OR null → default to first project
    setProjectId(projects[0]._id)
    return projects[0]
  }, [projects, projectId, setProjectId])

  /* -----------------------------------------------------------
     🟢 FIRST LOAD: Initialize store if empty
  ----------------------------------------------------------- */
  React.useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0]._id)
    }
  }, [projectId, projects, setProjectId])

  /* -----------------------------------------------------------
     🧭 USER SELECTS A PROJECT
  ----------------------------------------------------------- */
  const handleSelectProject = (project: Project) => {
    setProjectId(project._id)
    navigate({ to: '/projects/' + project._id })
  }

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

            {/* ALL PROJECTS */}
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer hover:bg-blue-50 transition"
              onClick={() => navigate({ to: '/' })}
            >
              <span className="text-blue-600 font-medium">All Projects</span>
            </DropdownMenuItem>

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
