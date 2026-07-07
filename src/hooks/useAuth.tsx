import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase, AuthUser, UserRole } from '@/lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'physchrono_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const table = role === 'teacher' ? 'teachers' : 'students'
      const emailCol = role === 'teacher' ? 't_email' : 's_email'
      const passwordCol = role === 'teacher' ? 't_password' : 's_password'

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(emailCol, email)
        .eq(passwordCol, password)
        .maybeSingle()

      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' }
      }

      if (!data) {
        return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
      }

      const authUser: AuthUser = {
        id: role === 'teacher' ? data.t_id : data.s_id,
        role,
        fullname: role === 'teacher' ? data.t_fullname : data.s_fullname,
        username: role === 'teacher' ? data.t_username : data.s_username,
        email: role === 'teacher' ? data.t_email : data.s_email,
        avatarUrl: role === 'teacher' ? (data.t_avatar_url || null) : (data.s_avatar_url || null),
      }

      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}