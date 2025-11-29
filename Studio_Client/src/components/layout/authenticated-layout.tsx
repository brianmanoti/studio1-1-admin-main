import { Outlet, useRouter } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useState } from 'react'
import { RouteSidebar } from './route-sidebar'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const router = useRouter()
  const { accessToken } = useAuthStore((state) => state.auth)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const tokenFromCookie = getCookie('access_token')

    if (!accessToken && !tokenFromCookie) {
      router.navigate({ to: '/sign-in', replace: true })
    } else {
      setIsCheckingAuth(false)
    }
  }, [accessToken, router])

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Checking session...
      </div>
    )
  }

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <RouteSidebar />
          <SidebarInset
            className={cn(
              '@container/content',
              'has-[[data-layout=fixed]]:h-svh',
              'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
