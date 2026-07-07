import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AtomLogo from './AtomLogo'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  userName: string
  userRole: 'ครู' | 'นักเรียน'
  homeLink: string
}

export default function Header({ userName, userRole, homeLink }: HeaderProps) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const initial = userName.charAt(0).toUpperCase()
  const avatarUrl = user?.avatarUrl || null

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const profileLink = userRole === 'ครู' ? '/teacher/profile' : '/student/profile'

  return (
    <header className="header">
      <Link to={homeLink} className="brand">
        <AtomLogo />
        <div className="brand-name">PHYS-CHRONO</div>
      </Link>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Avatar chip — คลิกเพื่อเปิด dropdown */}
        <div
          className="user-chip"
          onClick={() => setOpen(o => !o)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--cyan)',
              }}
            />
          ) : (
            <div className="avatar">{initial}</div>
          )}
          <div>
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
          {/* ลูกศรเล็กๆ */}
          <svg
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{
              marginLeft: 4, color: 'var(--text-3)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--bg-card)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 16px rgba(0,212,255,0.1)',
            minWidth: 180,
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeUp 0.15s ease',
          }}>
            {/* Profile info */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0,212,255,0.1)',
              fontSize: 13,
              color: 'var(--text-3)',
            }}>
              <div style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: 2 }}>{userName}</div>
              <div>{userRole}</div>
            </div>

            {/* Edit Profile */}
            <Link
              to={profileLink}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                color: 'var(--text-1)',
                textDecoration: 'none',
                fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elev)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              แก้ไขโปรไฟล์
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                borderTop: '1px solid rgba(0,212,255,0.1)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  )
}