import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useNavigate, useParams } from '@tanstack/react-router'

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

export function ProjectsSwitcher({ projects, isLoading, isError }: ProjectsSwitcherProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { id?: string }

  const [activeProject, setActiveProject] = React.useState<Project | null>(null)

  React.useEffect(() => {
    if (projects && projects.length > 0) {
      const found = params.id ? projects.find((p) => p._id === params.id) : null
      setActiveProject(found || projects[0])
    }
  }, [projects, params.id])

  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading projects...
      </p>
    )
  if (isError)
    return <p className="text-red-500 text-sm">Failed to load projects</p>
  if (!projects || projects.length === 0)
    return (
      <p
        className="text-gray-500 cursor-pointer hover:text-blue-600 transition"
        onClick={() => navigate({ to: '/projects/new' })}
      >
        No projects found — click to create one!
      </p>
    )

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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  {activeProject?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{activeProject?.name}</span>
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

            {projects.map((project) => (
              <DropdownMenuItem
                key={project._id}
                onClick={() => {
                  setActiveProject(project)
                  navigate({ to: '/projects/$id', params: { id: project._id } })
                }}
                className="gap-2 p-2"
              >
                {project.name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* ✅ Add Project Navigation Instead of Dialog */}
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer hover:bg-blue-50 transition"
              onClick={() => navigate({ to: '/projects/new' })}
            >
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4 text-blue-600" />
              </div>
              <div className="text-blue-600 font-medium">Add Project</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
