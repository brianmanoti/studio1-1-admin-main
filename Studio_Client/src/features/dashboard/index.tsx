import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

import { DashboardTabs } from './components/dashboard-tabs'
import { useProjectStore } from '@/stores/projectStore'
import { Skeleton } from '@/components/ui/skeleton'
import { useReports } from '@/hooks/use-reports'
import { useDownloadProjectPDF } from '@/hooks/PDFs/Project-PDF'
import { Download } from 'lucide-react'

export function Dashboard() {
  const projectId = useProjectStore((state) => state.projectId)

    const { mutateAsync: downloadProject, isPending } = useDownloadProjectPDF()

    const handleDownloadPDF = async () => {
    try {
      const blob = await downloadProject({ id: projectId})
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectId || "Project"}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download Project:", error)
    }
  }

   const { data: reports, isLoading: reportsLoading, error: reportsError } = useReports(projectId)

  if (reportsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          {/* Content Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (reportsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-semibold mb-2">Error Loading Dashboard</p>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reports) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No data available for this project</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'>
          <Button
            onClick={handleDownloadPDF}
            disabled={ isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            { isPending ? "Generating..." : "Download"}
          </Button>
          </div>
        </div>
        <DashboardTabs projectId={projectId} reports={reports} />         
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Subcontractors',
    href: '/projects/$projectId/subcontractors',
    isActive: false,
    disabled: false,
  },
  {
    title: 'items',
    href: '/projects/$projectId/items',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Vendors',
    href: '/projects/$projectId/vendors',
    isActive: false,
    disabled: false,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
