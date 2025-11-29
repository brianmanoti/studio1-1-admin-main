'use client'

import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route?.useSearch?.() ?? {} // safe fallback
  const navigate = route?.useNavigate?.() ?? (() => {}) // noop if undefined

  const { data: usersData, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/api/auth/users")
        return response?.data?.users ?? [] // default empty array
      } catch (error) {
        console.error("Failed to fetch users:", error)
        return [] // fallback in case of API error
      }
    },
  })

  const users = Array.isArray(usersData) ? usersData : [] // ensure array

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <button 
              onClick={() => window.history.back()}
              className='mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span>Loading users...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-destructive">
              <p>Failed to load users. Please try again.</p>
            </div>
          </div>
        ) : (
          <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
            <UsersTable data={users} search={search} navigate={navigate} />
          </div>
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}