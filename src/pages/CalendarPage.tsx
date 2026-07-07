import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { HomeIcon, BookIcon, CalendarIcon } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'

// ====== Types ======
interface Assignment {
  id: number
  title: string
  subject: string
  dueDate: string // 'YYYY-MM-DD'
  dueTime: string
  progress?: number   // student only (0-100)
  studentCount?: number // teacher only
  submitted?: number    // teacher only
  priority: 'urgent' | 'soon' | 'normal' // urgent=<3d, soon=<7d, normal
}

// TODO: ดึงข้อมูลจริงจาก API / Supabase แทน array นี้
const studentAssignments: Assignment[] = []
const teacherAssignments: Assignment[] = []

// ====== Helpers ======
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const DAYS_TH = ['อา','จ','อ','พ','พฤ','ศ','ส']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function daysUntil(dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(dueDate)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

interface CalendarPageProps {
  role: 'student' | 'teacher'
}

export default function CalendarPage({ role }: CalendarPageProps) {
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const assignments = role === 'student' ? studentAssignments : teacherAssignments

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const todayStr = formatDate(today)

  // Map dueDate → assignments
  const byDate: Record<string, Assignment[]> = {}
  assignments.forEach(a => {
    if (!byDate[a.dueDate]) byDate[a.dueDate] = []
    byDate[a.dueDate].push(a)
  })

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  const selectedAssignments = selectedDate ? (byDate[selectedDate] || []) : []

  // Sort by dueDate ascending
  const sortedAssignments = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const priorityColor = (p: Assignment['priority']) => {
    if (p === 'urgent') return 'var(--danger)'
    if (p === 'soon') return 'var(--warning)'
    return 'var(--cyan)'
  }
  const priorityLabel = (a: Assignment) => {
    const d = daysUntil(a.dueDate)
    if (d < 0) return { text: 'เลยกำหนด', color: '#888' }
    if (d === 0) return { text: 'วันนี้!', color: 'var(--danger)' }
    if (d === 1) return { text: 'พรุ่งนี้!', color: 'var(--danger)' }
    if (d <= 3) return { text: `อีก ${d} วัน`, color: 'var(--danger)' }
    if (d <= 7) return { text: `อีก ${d} วัน`, color: 'var(--warning)' }
    return { text: `อีก ${d} วัน`, color: 'var(--cyan)' }
  }

  return (
    <>
      <Header
        userName={user?.fullname || '—'}
        userRole={role === 'student' ? 'นักเรียน' : 'ครู'}
        homeLink={role === 'student' ? '/student' : '/teacher'}
      />

      <nav className="tabs">
        <Link to={role === 'student' ? '/student' : '/teacher'} className="tab">
          <HomeIcon /> เมนูหลัก
        </Link>
        {role === 'teacher' && (
          <Link to="/teacher/create-quiz" className="tab">
            <BookIcon /> ชุดฝึก
          </Link>
        )}
        <Link to={role === 'student' ? '/student/calendar' : '/teacher/calendar'} className="tab active">
          <CalendarIcon /> ปฏิทิน
        </Link>
      </nav>

      <div className="container">

        {/* ── Calendar Grid ── */}
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={navBtnStyle}>‹</button>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: 'var(--cyan)', letterSpacing: 2 }}>
              {MONTHS_TH[currentMonth]} {currentYear + 543}
            </div>
            <button onClick={nextMonth} style={navBtnStyle}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS_TH.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const hasItems = byDate[dateStr]
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dots = hasItems || []

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: 8,
                    cursor: hasItems ? 'pointer' : 'default',
                    background: isSelected
                      ? 'rgba(0,212,255,0.2)'
                      : isToday
                      ? 'rgba(0,212,255,0.08)'
                      : 'transparent',
                    border: isToday ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    fontSize: 14,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? 'var(--cyan)' : 'var(--text-1)',
                  }}>{day}</div>
                  {dots.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 3 }}>
                      {dots.slice(0, 3).map((a, idx) => (
                        <div key={idx} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: priorityColor(a.priority),
                          boxShadow: `0 0 4px ${priorityColor(a.priority)}`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,212,255,0.1)', flexWrap: 'wrap' }}>
            {[
              { color: 'var(--danger)', label: 'ด่วน (≤3 วัน)' },
              { color: 'var(--warning)', label: 'ใกล้กำหนด (≤7 วัน)' },
              { color: 'var(--cyan)', label: 'ปกติ' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Selected Date Detail ── */}
        {selectedDate && (
          <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(0,212,255,0.3)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
              กำหนดส่งวันที่ {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {selectedAssignments.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 14 }}>ไม่มีชุดฝึกที่กำหนดส่งวันนี้</div>
            ) : (
              selectedAssignments.map(a => (
                <AssignmentItem key={a.id} a={a} role={role} priorityLabel={priorityLabel} priorityColor={priorityColor} />
              ))
            )}
          </div>
        )}

        {/* ── Upcoming List ── */}
        <div className="card card-glow">
          <div className="section-title" style={{ marginBottom: 16 }}>📋 ชุดฝึกทั้งหมด — เรียงตามกำหนดส่ง</div>
          {sortedAssignments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: 'var(--text-3)', fontSize: 14,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              {role === 'student'
                ? <>ยังไม่มีชุดฝึก<br />รอครูมอบหมายงาน</>
                : <>ยังไม่มีชุดฝึกที่สร้างไว้<br />ไปสร้างชุดฝึกได้ที่เมนู "ชุดฝึก"</>
              }
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedAssignments.map(a => (
                <AssignmentItem key={a.id} a={a} role={role} priorityLabel={priorityLabel} priorityColor={priorityColor} />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}

// ── Assignment Item Component ──
function AssignmentItem({ a, role, priorityLabel, priorityColor }: {
  a: Assignment
  role: 'student' | 'teacher'
  priorityLabel: (a: Assignment) => { text: string; color: string }
  priorityColor: (p: Assignment['priority']) => string
}) {
  const pl = priorityLabel(a)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 12,
      background: 'var(--bg-card-2)',
      border: `1px solid ${priorityColor(a.priority)}33`,
      transition: 'all 0.2s',
    }}>
      {/* Priority bar */}
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 4, background: priorityColor(a.priority), flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 2 }}>{a.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.subject}</div>

        {/* Student: progress bar */}
        {role === 'student' && typeof a.progress === 'number' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
              <span>ความคืบหน้า</span>
              <span>{a.progress}%</span>
            </div>
            <div className="progress-bar-wrap" style={{ height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${a.progress}%` }} />
            </div>
          </div>
        )}

        {/* Teacher: submission count */}
        {role === 'teacher' && typeof a.submitted === 'number' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
              <span>ส่งแล้ว {a.submitted}/{a.studentCount} คน</span>
              <span>{Math.round((a.submitted! / a.studentCount!) * 100)}%</span>
            </div>
            <div className="progress-bar-wrap" style={{ height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${Math.round((a.submitted! / a.studentCount!) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Right: due info */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {new Date(a.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: pl.color, marginTop: 2 }}>{pl.text}</div>
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elev)',
  border: '1px solid rgba(0,212,255,0.2)',
  color: 'var(--cyan)',
  width: 36, height: 36,
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}