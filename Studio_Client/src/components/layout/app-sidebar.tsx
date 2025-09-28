import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { ProjectsSwitcher} from './Projects-switcher'
import { useAuthStore } from '@/stores/auth-store'
import { useProjects } from '@/lib/hooks/useProjects'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { data: projects, isLoading, isError } = useProjects()

  const user = useAuthStore((state) => state.auth.user)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <ProjectsSwitcher projects={projects} isLoading= {isLoading} isError={isError}/>
        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
