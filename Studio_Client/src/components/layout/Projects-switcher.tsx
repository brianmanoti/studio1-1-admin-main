// components/ProjectsSwitcher.tsx
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

  const [activeTeam, setActiveTeam] = React.useState<Project | null>(null)

  // Sync activeTeam with URL param
  React.useEffect(() => {
    if (projects && projects.length > 0) {
      const found = params.id ? projects.find((p) => p._id === params.id) : null
      setActiveTeam(found || projects[0])
    }
  }, [projects, params.id])

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>Failed to load projects</p>
  if (!projects || projects.length === 0)
    return <p className="text-gray-500">No projects found. Start by creating one!</p>

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeTeam?.name}
                </span>
                <span className='truncate text-xs'>{activeTeam?.client?.companyName}</span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Projects
            </DropdownMenuLabel>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project._id}
                onClick={() => {
                  setActiveTeam(project)
                  navigate({ to: '$id', params: { id: project._id } }) // update URL
                }}
                className='gap-2 p-2'
              >
                {project.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2'>
              <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                <Plus className='size-4' />
              </div>
              <div className='text-muted-foreground font-medium'>Add Project</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
