import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '@/components/Header'
import { HomeIcon, CalendarIcon, BookIcon } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [fullname, setFullname] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeacher = user?.role === 'teacher'

  // โหลดข้อมูลจาก Supabase
  useEffect(() => {
    if (!user) { navigate('/'); return }

    const fetchProfile = async () => {
      setLoading(true)
      const table = isTeacher ? 'teachers' : 'students'
      const idCol = isTeacher ? 't_id' : 's_id'

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(idCol, user.id)
        .maybeSingle()

      if (data) {
        setFullname(isTeacher ? data.t_fullname : data.s_fullname)
        setUsername(isTeacher ? data.t_username : data.s_username)
        setEmail(isTeacher ? data.t_email : data.s_email)
        setGender(isTeacher ? (data.t_gender || '') : (data.s_gender || ''))
        setAge(isTeacher ? (data.t_age || '') : (data.s_age || ''))
        setAvatarUrl(isTeacher ? (data.t_avatar_url || null) : (data.s_avatar_url || null))
      }
      if (error) console.error(error)
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 2MB')
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    if (!fullname || !username || !email) {
      setError('กรุณากรอกชื่อ, username และอีเมล')
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (newPassword && newPassword.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setSaving(true)

    // อัปโหลดรูปโปรไฟล์ก่อน (ถ้ามี)
    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      setUploadingAvatar(true)
      const ext = avatarFile.name.split('.').pop()
      const fileName = `${isTeacher ? 't' : 's'}_${user!.id}_${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true })

      if (uploadError) {
        setError('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่')
        setSaving(false)
        setUploadingAvatar(false)
        return
      }

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      newAvatarUrl = publicData.publicUrl
      setAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview(null)
      setUploadingAvatar(false)
    }

    const table = isTeacher ? 'teachers' : 'students'
    const idCol = isTeacher ? 't_id' : 's_id'

    const updateData: Record<string, any> = isTeacher
      ? {
          t_fullname: fullname,
          t_username: username,
          t_email: email,
          t_gender: gender || null,
          t_age: age ? parseInt(age) : null,
          t_avatar_url: newAvatarUrl,
        }
      : {
          s_fullname: fullname,
          s_username: username,
          s_email: email,
          s_gender: gender || null,
          s_age: age ? parseInt(age) : null,
          s_avatar_url: newAvatarUrl,
        }

    if (newPassword) {
      updateData[isTeacher ? 't_password' : 's_password'] = newPassword
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq(idCol, user!.id)

    setSaving(false)

    if (updateError) {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
      return
    }

    updateUser({ fullname, username, email, avatarUrl: newAvatarUrl })
    setSuccess(true)
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  const role = isTeacher ? 'ครู' : 'นักเรียน'
  const homeLink = isTeacher ? '/teacher' : '/student'
  const calendarLink = isTeacher ? '/teacher/calendar' : '/student/calendar'

  return (
    <>
      <Header userName={fullname || user.fullname} userRole={role} homeLink={homeLink} />

      <nav className="tabs">
        <Link to={homeLink} className="tab">
          <HomeIcon /> เมนูหลัก
        </Link>
        {isTeacher && (
          <Link to="/teacher/create-quiz" className="tab">
            <BookIcon /> ชุดฝึก
          </Link>
        )}
        <Link to={calendarLink} className="tab">
          <CalendarIcon /> ปฏิทิน
        </Link>
      </nav>

      <div className="container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
            กำลังโหลด...
          </div>
        ) : (
          <>
            {/* Avatar + ชื่อ */}
            <div className="card card-glow" style={{ textAlign: 'center', marginBottom: 20, padding: 32 }}>
              {/* รูปโปรไฟล์ */}
              <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px' }}>
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl!}
                    alt="profile"
                    style={{
                      width: 96, height: 96, borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--cyan)',
                      boxShadow: '0 0 24px rgba(0,212,255,0.4)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--cyan), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 700, color: '#0a0e1a',
                    boxShadow: '0 0 24px rgba(0,212,255,0.4)',
                    fontFamily: 'Orbitron, sans-serif',
                  }}>
                    {fullname.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* ปุ่มกล้อง */}
                <label htmlFor="avatar-upload" style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--cyan)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  border: '2px solid #0a0e1a',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0e1a" strokeWidth="2.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                  disabled={saving}
                />
              </div>

              {/* hint */}
              {avatarPreview && (
                <div style={{ fontSize: 12, color: 'var(--cyan)', marginBottom: 8 }}>
                  📸 รูปใหม่พร้อมบันทึก — กด "บันทึกข้อมูล" เพื่อยืนยัน
                </div>
              )}
              {!avatarPreview && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  กดไอคอนกล้องเพื่อเปลี่ยนรูปโปรไฟล์ (สูงสุด 2MB)
                </div>
              )}

              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                {fullname}
              </div>
              <div style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                fontSize: 13, color: 'var(--cyan)',
              }}>
                {role}
              </div>
            </div>

            {/* ฟอร์มแก้ไข */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 20 }}>✏️ แก้ไขข้อมูลส่วนตัว</div>

              <div className="field">
                <label className="label">ชื่อ-นามสกุล</label>
                <input
                  className="input"
                  type="text"
                  value={fullname}
                  onChange={e => setFullname(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="label">ชื่อผู้ใช้</label>
                <input
                  className="input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="label">อีเมล</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-grid" style={{ gap: 12 }}>
                <div className="field">
                  <label className="label">เพศ</label>
                  <select
                    className="input"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    disabled={saving}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- เลือก --</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">อายุ</label>
                  <input
                    className="input"
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    disabled={saving}
                    min={1} max={99}
                  />
                </div>
              </div>
            </div>

            {/* เปลี่ยนรหัสผ่าน */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 20 }}>🔒 เปลี่ยนรหัสผ่าน</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้
              </div>

              <div className="field">
                <label className="label">รหัสผ่านใหม่</label>
                <input
                  className="input"
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="label">ยืนยันรหัสผ่านใหม่</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{
                padding: '12px 16px', marginBottom: 16,
                background: 'rgba(255,71,87,0.1)',
                border: '1px solid rgba(255,71,87,0.3)',
                borderRadius: 12, color: '#ff4757', fontSize: 14, textAlign: 'center',
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '12px 16px', marginBottom: 16,
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: 12, color: 'var(--cyan)', fontSize: 14, textAlign: 'center',
              }}>
                ✅ บันทึกข้อมูลสำเร็จ!
              </div>
            )}

            {/* ปุ่ม */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '16px', fontSize: 16 }}
              >
                {saving ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '14px', fontSize: 15, borderRadius: 12,
                  background: 'rgba(255,71,87,0.1)',
                  border: '1px solid rgba(255,71,87,0.3)',
                  color: '#ff4757', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}