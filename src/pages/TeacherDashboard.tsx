import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { HomeIcon, BookIcon, CalendarIcon, PlusFile, TrashIcon, FlameIcon } from '@/components/Icons'
import { supabase } from '@/lib/supabase'

interface ClassRow {
  c_id: number
  c_name: string
  c_join_code: string
  c_students: number[]
}

interface HomeworkRow {
  h_id: number
  h_name: string
  h_subject: string
  h_created_at: string
}

interface ScoreRow {
  a_hid: number
  a_cid: number
  a_score: number
  a_type: string
  a_best_streak: number
  student_name: string
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [homeworks, setHomeworks] = useState<HomeworkRow[]>([])
  const [assignedCount, setAssignedCount] = useState<Record<number, number>>({})
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [filterClassId, setFilterClassId] = useState<number | 'all'>('all')
  const [filterHwId, setFilterHwId] = useState<number | null>(null)
  const [deletingHwId, setDeletingHwId] = useState<number | null>(null)

  useEffect(() => {
    if (user) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadData() {
    if (!user) return
    setLoadingData(true)

    const [classesRes, homeworksRes] = await Promise.all([
      supabase
        .from('classs')
        .select('c_id, c_name, c_join_code, c_students')
        .eq('c_tid', user.id)
        .order('c_created_at', { ascending: false }),
      supabase
        .from('homework')
        .select('h_id, h_name, h_subject, h_created_at')
        .eq('h_tid', user.id)
        .order('h_created_at', { ascending: false }),
    ])

    if (classesRes.data) setClasses(classesRes.data as ClassRow[])

    if (homeworksRes.data) {
      const allHws = homeworksRes.data as HomeworkRow[]
      const hwIds = allHws.map(h => h.h_id)

      if (hwIds.length > 0) {
        const { data: activesData } = await supabase
          .from('actives')
          .select('a_hid, a_cid, a_score, a_type, a_best_streak, students(s_fullname)')
          .in('a_hid', hwIds)

        if (activesData) {
          const counts: Record<number, number> = {}
          const scores: ScoreRow[] = []

          for (const row of activesData as any[]) {
            counts[row.a_hid] = (counts[row.a_hid] || 0) + 1
            const student = Array.isArray(row.students) ? row.students[0] : row.students
            scores.push({
              a_hid: row.a_hid,
              a_cid: row.a_cid,
              a_score: row.a_score ?? 0,
              a_type: row.a_type,
              a_best_streak: row.a_best_streak ?? 0,
              student_name: student?.s_fullname ?? 'ไม่ทราบชื่อ',
            })
          }

          setAssignedCount(counts)
          setScoreRows(scores)

          // แสดงเฉพาะชุดฝึกที่ "สั่งไว้" จริง (มีนักเรียนได้รับมอบหมายแล้ว)
          const assignedHws = allHws.filter(h => counts[h.h_id] > 0)
          setHomeworks(assignedHws)
          if (assignedHws.length > 0 && filterHwId === null) {
            setFilterHwId(assignedHws[0].h_id)
          }
        } else {
          setHomeworks([])
        }
      } else {
        setHomeworks([])
      }
    }

    setLoadingData(false)
  }

  async function handleDeleteHomework(h: HomeworkRow) {
    const ok = window.confirm(`ต้องการลบชุดฝึก "${h.h_name}" ใช่หรือไม่?\nข้อมูลคะแนนและการมอบหมายที่เกี่ยวข้องจะถูกลบทั้งหมด และไม่สามารถกู้คืนได้`)
    if (!ok) return

    setDeletingHwId(h.h_id)
    try {
      const { error } = await supabase.from('homework').delete().eq('h_id', h.h_id)
      if (error) throw error

      setHomeworks(prev => prev.filter(x => x.h_id !== h.h_id))
      setScoreRows(prev => prev.filter(r => r.a_hid !== h.h_id))
      setAssignedCount(prev => {
        const next = { ...prev }
        delete next[h.h_id]
        return next
      })
      if (filterHwId === h.h_id) setFilterHwId(null)
    } catch (err) {
      console.error(err)
      window.alert('ลบชุดฝึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setDeletingHwId(null)
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
    } catch {
      return '-'
    }
  }

  // ตัวเลือกชุดฝึกในดรอปดาวน์ (กรองตามห้องที่เลือกด้วย ถ้าเลือกห้องไว้)
  const homeworkOptions = useMemo(() => {
    if (filterClassId === 'all') return homeworks
    const hwIdsInClass = new Set(scoreRows.filter(r => r.a_cid === filterClassId).map(r => r.a_hid))
    return homeworks.filter(h => hwIdsInClass.has(h.h_id))
  }, [homeworks, scoreRows, filterClassId])

  // ข้อมูลคะแนนที่จะเอาไปวาดกราฟ
  const chartRows = useMemo(() => {
    if (!filterHwId) return []
    return scoreRows.filter(r =>
      r.a_hid === filterHwId && (filterClassId === 'all' || r.a_cid === filterClassId)
    )
  }, [scoreRows, filterHwId, filterClassId])

  const maxScore = 100

  return (
    <>
      <Header userName={user?.fullname || '—'} userRole="ครู" homeLink="/teacher" />

      <nav className="tabs">
        <Link to="/teacher" className="tab active"><HomeIcon />เมนูหลัก</Link>
        <Link to="/teacher/create-quiz" className="tab"><BookIcon />ชุดฝึก</Link>
        <Link to="/teacher/calendar" className="tab"><CalendarIcon />ปฏิทิน</Link>
      </nav>

      <div className="container">
        {/* ห้องเรียนของฉัน */}
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          <div className="section-title">ห้องเรียนของฉัน</div>
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: 14 }}>กำลังโหลด...</div>
          ) : classes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-3)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🏫</div>
              ยังไม่มีห้องเรียน — สร้างได้ที่หน้า "สร้างชุดฝึก"
            </div>
          ) : (
            <div className="top-list">
              {classes.map(c => (
                <div className="top-item" key={c.c_id}>
                  <div className="top-info">
                    <div className="top-name">{c.c_name}</div>
                    <div className="top-meta">
                      รหัสเข้าห้อง: <strong>{c.c_join_code}</strong> · นักเรียน {c.c_students?.length ?? 0} คน
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* กราฟคะแนน พร้อมตัวกรองห้อง/บท */}
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>
            คะแนนของนักเรียนแต่ละคน (เลือกห้องและชุดฝึกที่ต้องการดู)
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <select
              className="input"
              style={{ maxWidth: 220, cursor: 'pointer' }}
              value={filterClassId}
              onChange={e => setFilterClassId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">ทุกห้องเรียน</option>
              {classes.map(c => (
                <option key={c.c_id} value={c.c_id}>{c.c_name}</option>
              ))}
            </select>

            <select
              className="input"
              style={{ maxWidth: 280, cursor: 'pointer' }}
              value={filterHwId ?? ''}
              onChange={e => setFilterHwId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">-- เลือกชุดฝึก --</option>
              {homeworkOptions.map(h => (
                <option key={h.h_id} value={h.h_id}>{h.h_name}</option>
              ))}
            </select>
          </div>

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)', fontSize: 14 }}>กำลังโหลด...</div>
          ) : homeworks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 10, color: 'var(--text-3)', fontSize: 14 }}>
              <div style={{ fontSize: 40 }}>📊</div>
              ยังไม่มีชุดฝึกที่มอบหมายให้นักเรียน
            </div>
          ) : chartRows.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 10, color: 'var(--text-3)', fontSize: 14 }}>
              <div style={{ fontSize: 40 }}>📊</div>
              ไม่มีนักเรียนในตัวกรองนี้
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 14,
              height: 220, overflowX: 'auto', padding: '0 4px 8px',
            }}>
              {chartRows.map((r, i) => {
                const submitted = r.a_type === 'submitted' || r.a_type === 'done'
                const barHeight = submitted ? Math.max((r.a_score / maxScore) * 170, 4) : 4
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: 56, flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 12, marginBottom: 6, color: submitted ? 'var(--cyan)' : 'var(--text-3)', fontWeight: 700 }}>
                      {submitted ? r.a_score : '-'}
                    </div>
                    <div style={{
                      width: 28, height: barHeight, borderRadius: '6px 6px 0 0',
                      background: submitted
                        ? 'linear-gradient(180deg, var(--cyan), rgba(0,212,255,0.3))'
                        : 'rgba(255,255,255,0.08)',
                      transition: 'height 0.5s ease',
                    }} />
                    <div style={{
                      fontSize: 11, color: 'var(--text-3)', marginTop: 8,
                      textAlign: 'center', maxWidth: 60, overflowWrap: 'break-word',
                    }}>
                      {r.student_name}
                    </div>
                    {!submitted && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>ยังไม่ส่ง</div>
                    )}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3, marginTop: 6,
                      fontSize: 11, fontWeight: 700, color: r.a_best_streak > 0 ? '#ff9b3d' : 'var(--text-3)',
                    }} title="ตอบถูกต่อเนื่องสูงสุด">
                      <span style={{ width: 12, height: 12, display: 'inline-flex' }}><FlameIcon /></span>
                      {r.a_best_streak}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="card card-glow">
            <div className="section-title">ชุดฝึกที่สั่งไว้</div>
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: 14 }}>กำลังโหลด...</div>
            ) : homeworks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-3)', fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                ยังไม่มีชุดฝึกที่มอบหมาย<br />กด "เพิ่มชุดฝึก" เพื่อเริ่มสร้าง
              </div>
            ) : (
              <div className="top-list">
                {homeworks.map((h) => (
                  <div className="top-item" key={h.h_id}>
                    <div className="top-info">
                      <div className="top-name">{h.h_name}</div>
                      <div className="top-meta">{h.h_subject} · สร้างเมื่อ {formatDate(h.h_created_at)}</div>
                    </div>
                    <div className="top-count">{assignedCount[h.h_id] ?? 0} คน</div>
                    <button
                      type="button"
                      className="top-delete-btn"
                      title="ลบชุดฝึก"
                      aria-label="ลบชุดฝึก"
                      disabled={deletingHwId === h.h_id}
                      onClick={() => handleDeleteHomework(h)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link to="/teacher/create-quiz" className="add-quiz">
            <PlusFile />
            เพิ่มชุดฝึก
          </Link>
        </div>
      </div>
    </>
  )
}
