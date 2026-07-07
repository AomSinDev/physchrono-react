import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import BigAtom from '@/components/BigAtom'
import { LoginArrow, StudentCap, TeacherBoard } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [role, setRole] = useState<UserRole>('student')
  const [email, setEmail] = useState('maxs@school.ac.th')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)

    const result = await login(email, password, role)

    setLoading(false)

    if (result.success) {
      navigate(role === 'teacher' ? '/teacher' : '/student')
    } else {
      setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  // เปลี่ยน email อัตโนมัติเมื่อสลับ role (เพื่อความสะดวกในการ test)
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setEmail(newRole === 'teacher' ? 'max@school.ac.th' : 'maxs@school.ac.th')
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <BigAtom />
        </div>
        <div className="brand-title">PHYS-CHRONO</div>
        <div className="brand-sub">Physics × Time × Intelligence</div>

        <div className="role-title">ประเภทผู้ใช้งาน</div>
        <div className="role-grid">
          <button
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
            disabled={loading}
          >
            <StudentCap />
            นักเรียน
          </button>
          <button
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => handleRoleChange('teacher')}
            disabled={loading}
          >
            <TeacherBoard />
            ครู
          </button>
        </div>

        <div className="field">
          <label className="label">อีเมล</label>
          <input
            className="input"
            type="email"
            placeholder="you@school.ac.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="field">
          <label className="label">รหัสผ่าน</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: 12,
              color: '#ff4757',
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <button
          className="btn btn-primary login-submit"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <>กำลังเข้าสู่ระบบ...</>
          ) : (
            <>
              <LoginArrow />
              เข้าสู่ระบบ
            </>
          )}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-3)' }}>
          ยังไม่มีบัญชี?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  )
}
