import { createContext, useContext, useState, useEffect } from "react"

interface User {
  userId: string
  name: string
  email: string
  role: string
  status: string
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = sessionStorage.getItem("user")

    if (storedToken) setToken(storedToken)
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  const clearAuth = () => {
    localStorage.removeItem("auth_token")
    sessionStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
