import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { HomeIcon, BookIcon, CalendarIcon, PlusFile } from '@/components/Icons'
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

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [homeworks, setHomeworks] = useState<HomeworkRow[]>([])
  const [assignedCount, setAssignedCount] = useState<Record<number, number>>({})
  const [loadingData, setLoadingData] = useState(true)

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
      const hws = homeworksRes.data as HomeworkRow[]
      setHomeworks(hws)

      // นับจำนวนนักเรียนที่ได้รับมอบหมายในแต่ละชุดฝึก
      const hwIds = hws.map(h => h.h_id)
      if (hwIds.length > 0) {
        const { data: activesData } = await supabase
          .from('actives')
          .select('a_hid')
          .in('a_hid', hwIds)

        if (activesData) {
          const counts: Record<number, number> = {}
          for (const row of activesData as { a_hid: number }[]) {
            counts[row.a_hid] = (counts[row.a_hid] || 0) + 1
          }
          setAssignedCount(counts)
        }
      }
    }

    setLoadingData(false)
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
    } catch {
      return '-'
    }
  }

  return (
    <>
      <Header userName={user?.fullname || '—'} userRole="ครู" homeLink="/teacher" />

      <nav className="tabs">
        <Link to="/teacher" className="tab active">
          <HomeIcon />
          เมนูหลัก
        </Link>
        <Link to="/teacher/create-quiz" className="tab">
          <BookIcon />
          ชุดฝึก
        </Link>
        <Link to="/teacher/calendar" className="tab">
          <CalendarIcon />
          ปฏิทิน
        </Link>
      </nav>

      <div className="container">
        {/* ห้องเรียนของฉัน */}
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          <div className="section-title">ห้องเรียนของฉัน</div>
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: 14 }}>
              กำลังโหลด...
            </div>
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

        {/* กราฟ — รอข้อมูลหลังนักเรียนทำแบบฝึกหัด */}
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          <div className="section-title">
            คะแนนในแต่ละชุดแบบฝึกที่ให้นักเรียนทำ (คะแนนเฉลี่ย/คะแนนเต็ม)
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '60px 24px', gap: 12,
            color: 'var(--text-3)', fontSize: 14,
          }}>
            <div style={{ fontSize: 40 }}>📊</div>
            <div>ยังไม่มีข้อมูลคะแนน</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
              กราฟจะแสดงหลังจากนักเรียนเริ่มทำแบบฝึกหัด
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card card-glow">
            <div className="section-title">ชุดฝึกที่สร้างไว้ล่าสุด</div>
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: 14 }}>
                กำลังโหลด...
              </div>
            ) : homeworks.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 24px',
                color: 'var(--text-3)', fontSize: 14,
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                ยังไม่มีชุดฝึก<br />กด "เพิ่มชุดฝึก" เพื่อเริ่มสร้าง
              </div>
            ) : (
              <div className="top-list">
                {homeworks.map((h) => (
                  <div className="top-item" key={h.h_id}>
                    <div className="top-info">
                      <div className="top-name">{h.h_name}</div>
                      <div className="top-meta">
                        {h.h_subject} · สร้างเมื่อ {formatDate(h.h_created_at)}
                      </div>
                    </div>
                    <div className="top-count">{assignedCount[h.h_id] ?? 0} คน</div>
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
