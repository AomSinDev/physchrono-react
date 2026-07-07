import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { HomeIcon, BookIcon, CalendarIcon, PlusFile } from '@/components/Icons'

// TODO: ดึงข้อมูลจริงจาก API / Supabase หลังนักเรียนทำแบบฝึกหัด
const topQuizzes: { name: string; meta: string; count: number }[] = []

export default function TeacherDashboard() {
  const { user } = useAuth()

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
            <div className="section-title">ชุดฝึกที่นักเรียนทำเสร็จมากที่สุด 5 อันดับแรก</div>
            {topQuizzes.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 24px',
                color: 'var(--text-3)', fontSize: 14,
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                ยังไม่มีข้อมูล<br />รอนักเรียนทำแบบฝึกหัด
              </div>
            ) : (
              <div className="top-list">
                {topQuizzes.map((q, i) => (
                  <div className="top-item" key={i}>
                    <div className="rank-num">{i + 1}</div>
                    <div className="top-info">
                      <div className="top-name">{q.name}</div>
                      <div className="top-meta">{q.meta}</div>
                    </div>
                    <div className="top-count">{q.count}</div>
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