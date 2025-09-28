import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'access_token'
const USER_DATA = 'user_data'

interface UserPreferences {
  notifications: Record<string, boolean>
  profile: { theme: string; language: string }
}

export interface AuthUser {
  userId: string
  name: string
  email: string
  role: string
  status: string
  profileImage: string
  preferences: UserPreferences
}

interface AuthState {
  auth: {
    user: AuthUser | null
    accessToken: string
    setUser: (user: AuthUser | null) => void
    setAccessToken: (token: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  // initialize token
  let initToken = ''
  const cookieToken = getCookie(ACCESS_TOKEN)
  if (cookieToken) {
    try {
      initToken = JSON.parse(cookieToken)
    } catch {
      removeCookie(ACCESS_TOKEN)
      initToken = ''
    }
  }

  // initialize user
  let initUser: AuthUser | null = null
  const cookieUser = getCookie(USER_DATA)
  if (cookieUser) {
    try {
      initUser = JSON.parse(cookieUser)
    } catch {
      removeCookie(USER_DATA)
      initUser = null
    }
  }

  return {
    auth: {
      user: initUser,
      accessToken: initToken,
      setUser: (user: AuthUser | null) => {
        if (user) setCookie(USER_DATA, JSON.stringify(user))
        else removeCookie(USER_DATA)
        set((state) => ({ ...state, auth: { ...state.auth, user } }))
      },
      setAccessToken: (token: string) => {
        if (token) setCookie(ACCESS_TOKEN, JSON.stringify(token))
        else removeCookie(ACCESS_TOKEN)
        set((state) => ({ ...state, auth: { ...state.auth, accessToken: token } }))
      },
      resetAccessToken: () => {
        removeCookie(ACCESS_TOKEN)
        set((state) => ({ ...state, auth: { ...state.auth, accessToken: '' } }))
      },
      reset: () => {
        removeCookie(ACCESS_TOKEN)
        removeCookie(USER_DATA)
        set((state) => ({ ...state, auth: { ...state.auth, user: null, accessToken: '' } }))
      },
    },
  }
})
