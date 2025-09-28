import { useState, useEffect } from "react"

interface User {
  userId: string
  name: string
  email: string
  role: string
  status: string
  profileImage?: string
  preferences?: Record<string, any>
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = sessionStorage.getItem("user")

    if (storedToken) setToken(storedToken)
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  // ✅ Login method
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken)
    sessionStorage.setItem("user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const clearAuth = () => {
    localStorage.removeItem("auth_token")
    sessionStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return { token, user, login, clearAuth }
}
