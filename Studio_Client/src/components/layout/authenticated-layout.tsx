import { Outlet, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { accessToken } = useAuthStore((state) => state.auth)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check auth status from cookies and Zustand
    const token = accessToken || getCookie('access_token')

    if (!token) {
      router.navigate({ to: '/sign-in', replace: true })
    } else {
      setIsCheckingAuth(false)
    }
  }, [accessToken, router])

  // Show loading or redirect message while checking
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Checking authentication...
      </div>
    )
  }

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
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
