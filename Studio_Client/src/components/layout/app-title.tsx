import { Link } from '@tanstack/react-router'
import { Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '../ui/button'

export function AppTitle() {
  const { setOpenMobile } = useSidebar()
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='group gap-0 py-0 px-4 hover:bg-transparent active:bg-transparent border-b border-border/40'
          asChild
        >
          <div className='flex items-center justify-between w-full'>
            <Link
              to='/'
              onClick={() => setOpenMobile(false)}
              className='group flex items-center gap-3 flex-1 text-start min-w-0'
            >
              <div className='flex items-center justify-center size-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-200 shadow-sm'>
                <Sparkles className='size-4 text-white' />
              </div>
              <div className='flex flex-col min-w-0'>
                <span className='truncate font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent'>
                  Studio 1-1
                </span>
                <span className='truncate text-xs text-muted-foreground font-medium'>
                  Creative Platform
                </span>
              </div>
            </Link>
            <ToggleSidebar />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ToggleSidebar({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar='trigger'
      data-slot='sidebar-trigger'
      variant='ghost'
      size='icon'
      className={cn(
        'aspect-square size-9 max-md:scale-125',
        'border border-border/50 bg-background/80 backdrop-blur-sm',
        'hover:bg-accent hover:border-border hover:shadow-sm',
        'transition-all duration-200',
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <X className='md:hidden size-4' />
      <Menu className='max-md:hidden size-4' />
      <span className='sr-only'>Toggle Sidebar</span>
    </Button>
  )
}