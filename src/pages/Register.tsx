import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import BigAtom from '@/components/BigAtom'
import { StudentCap, TeacherBoard } from '@/components/Icons'
import { supabase, UserRole } from '@/lib/supabase'

export default function Register() {
  const navigate = useNavigate()

  const [role, setRole] = useState<UserRole>('student')
  const [fullname, setFullname] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError(null)

    // Validate
    if (!fullname || !username || !email || !password || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      const table = role === 'teacher' ? 'teachers' : 'students'
      const emailCol = role === 'teacher' ? 't_email' : 's_email'

      // Check duplicate email
      const { data: existing } = await supabase
        .from(table)
        .select('*')
        .eq(emailCol, email)
        .maybeSingle()

      if (existing) {
        setError('อีเมลนี้ถูกใช้งานแล้ว')
        setLoading(false)
        return
      }

      // Insert new user
      const insertData =
        role === 'teacher'
          ? {
              t_fullname: fullname,
              t_username: username,
              t_email: email,
              t_password: password,
              t_gender: gender || null,
              t_age: age ? parseInt(age) : null,
            }
          : {
              s_fullname: fullname,
              s_username: username,
              s_email: email,
              s_password: password,
              s_gender: gender || null,
              s_age: age ? parseInt(age) : null,
              s_best_streak: 0,
              s_streak_points: 0,
            }

      const { error: insertError } = await supabase.from(table).insert([insertData])

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('เกิดข้อผิดพลาดในการสมัคร กรุณาลองใหม่')
        setLoading(false)
        return
      }

      // Success → go to login
      navigate('/', { state: { registered: true } })
    } catch (err) {
      console.error(err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }

    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-logo">
          <BigAtom />
        </div>
        <div className="brand-title">PHYS-CHRONO</div>
        <div className="brand-sub">สมัครสมาชิก</div>

        <div className="role-title">ประเภทผู้ใช้งาน</div>
        <div className="role-grid">
          <button
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
            disabled={loading}
          >
            <StudentCap />
            นักเรียน
          </button>
          <button
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
            disabled={loading}
          >
            <TeacherBoard />
            ครู
          </button>
        </div>

        <div className="field">
          <label className="label">ชื่อ-นามสกุล</label>
          <input
            className="input"
            type="text"
            placeholder="ชื่อเต็มของคุณ"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label className="label">ชื่อผู้ใช้</label>
          <input
            className="input"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
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

        <div className="form-grid" style={{ gap: 12 }}>
          <div className="field">
            <label className="label">เพศ (ไม่บังคับ)</label>
            <select
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              <option value="">-- เลือก --</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          <div className="field">
            <label className="label">อายุ (ไม่บังคับ)</label>
            <input
              className="input"
              type="number"
              placeholder="อายุ"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              disabled={loading}
              min={1}
              max={99}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">รหัสผ่าน</label>
          <input
            className="input"
            type="password"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label className="label">ยืนยันรหัสผ่าน</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
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
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? <>กำลังสมัคร...</> : <>✨ สมัครสมาชิก</>}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-3)' }}>
          มีบัญชีแล้ว?{' '}
          <Link
            to="/"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}
