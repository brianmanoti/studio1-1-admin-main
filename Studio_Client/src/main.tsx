import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { routeTree } from './routeTree.gen'
import './styles/index.css'

// ✅ Initialize router first
const router = createRouter({
  routeTree,
  context: {}, // We'll inject queryClient later
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// ✅ Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (!(error instanceof AxiosError)) return

      const status = error.response?.status
      const auth = useAuthStore.getState().auth

      // ✅ Only handle real expired sessions — not early 401s
      if (status === 401) {
        if (auth.accessToken) {
          toast.error('Session expired! Please log in again.')

          // Clear auth only once safely
          auth.reset()

          // Delay redirect slightly to avoid race conditions
          setTimeout(() => {
            const redirect = `${window.location.pathname}${window.location.search}`
            router.navigate({ to: '/sign-in', search: { redirect } })
          }, 300)
        }
      }

      if (status === 500) {
        toast.error('Internal Server Error!')
        router.navigate({ to: '/500' })
      }

      if (status === 403) {
        // router.navigate({ to: '/forbidden', replace: true })
      }
    },
  }),
})

// ✅ Inject queryClient into router context properly
router.update({
  context: { queryClient },
})

// Type registration for TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// ✅ Render app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
