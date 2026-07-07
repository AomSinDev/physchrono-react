import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import Counter from '@/components/Counter'
import {
  HomeIcon,
  CalendarIcon,
  OpenBook,
  StarIcon,
  TrophyIcon,
  FlameIcon,
  CheckCircle,
} from '@/components/Icons'

// TODO: ข้อมูลนี้จะถูกดึงจาก AI/API — ตัวอย่างโครงสร้าง
interface QuizCard {
  num: number
  title: string
  date: string
  time: string
  progress: number
  dueDate: string
}

interface StudentStats {
  totalDone: number
  totalScore: number
  bestScore: number
  streak: number
  overallProgress: number
  quizCards: QuizCard[]
}

// Placeholder รอ AI ใส่ข้อมูลจริง
const LOADING_STATS: StudentStats = {
  totalDone: 0,
  totalScore: 0,
  bestScore: 0,
  streak: 0,
  overallProgress: 0,
  quizCards: [],
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StudentStats>(LOADING_STATS)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    // TODO: ดึงข้อมูลจริงจาก API / Supabase / AI
    // ตัวอย่าง: fetchStudentStats(userId).then(data => { setStats(data); setLoadingData(false) })
    // ตอนนี้รอข้อมูลจาก AI — แสดง skeleton ไปก่อน
    const timer = setTimeout(() => setLoadingData(false), 800) // ลบ timer นี้เมื่อต่อ API จริง
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Header userName={user?.fullname || '—'} userRole="นักเรียน" homeLink="/student" />

      <nav className="tabs">
        <Link to="/student" className="tab active">
          <HomeIcon />
          เมนูหลัก
        </Link>
        <Link to="/student/calendar" className="tab">
          <CalendarIcon />
          ปฏิทิน
        </Link>
      </nav>

      <div className="container">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon"><OpenBook /></div>
            <div className="stat-value">
              {loadingData ? <span style={{ color: 'var(--text-3)' }}>—</span> : <Counter target={stats.totalDone} />}
            </div>
            <div className="stat-label">จำนวนที่ทำ</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><StarIcon /></div>
            <div className="stat-value">
              {loadingData ? <span style={{ color: 'var(--text-3)' }}>—</span> : <Counter target={stats.totalScore} />}
            </div>
            <div className="stat-label">คะแนน</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><TrophyIcon /></div>
            <div className="stat-value">
              {loadingData ? <span style={{ color: 'var(--text-3)' }}>—</span> : <Counter target={stats.bestScore} />}
            </div>
            <div className="stat-label">คะแนนที่ทำได้ดีที่สุด</div>
          </div>
          <div className="stat-card streak-card">
            <div className="stat-icon"><FlameIcon /></div>
            <div className="stat-value">
              {loadingData ? <span style={{ color: 'var(--text-3)' }}>—</span> : <Counter target={stats.streak} />}
            </div>
            <div className="stat-label">สถิติตอบถูกต่อเนื่อง</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-card">
          <CheckCircle />
          <div className="progress-content">
            <div className="progress-label">
              <span>เรียนเสร็จแล้ว</span>
              <span className="progress-pct">
                {loadingData ? '—' : `${stats.overallProgress}%`}
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: loadingData ? '0%' : `${stats.overallProgress}%`, transition: 'width 0.8s ease' }}
              />
            </div>
          </div>
        </div>

        {/* Quiz List */}
        <div className="quiz-list">
          {loadingData ? (
            // Skeleton placeholder รอข้อมูล
            [1, 2, 3].map((i) => (
              <div key={i} className="quiz-card" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                <div className="quiz-card-head">
                  <div className="quiz-num">?</div>
                  <div className="quiz-card-title">
                    <span className="quiz-card-prefix">ชุดฝึก :</span>
                    <br />
                    <span style={{ color: 'var(--text-3)' }}>กำลังโหลด...</span>
                  </div>
                </div>
                <div className="quiz-meta">
                  <div style={{ color: 'var(--text-3)' }}>วันที่ —<br />เวลา —</div>
                  <div className="quiz-meta-r" style={{ color: 'var(--text-3)' }}>ทำแล้ว —%<br />ภายในวันที่ —</div>
                </div>
                <div className="mini-bar-wrap">
                  <div className="mini-bar-fill" style={{ width: '0%' }} />
                </div>
              </div>
            ))
          ) : stats.quizCards.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: 'var(--text-3)', fontSize: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              ยังไม่มีแบบฝึกหัด<br />รอครูมอบหมายงาน
            </div>
          ) : (
            stats.quizCards.map((q) => (
              <Link to="/student/quiz" className="quiz-card" key={q.num}>
                <div className="quiz-card-head">
                  <div className="quiz-num">{q.num}</div>
                  <div className="quiz-card-title">
                    <span className="quiz-card-prefix">ชุดฝึก :</span>
                    <br />
                    {q.title}
                  </div>
                </div>
                <div className="quiz-meta">
                  <div>
                    วันที่ {q.date}
                    <br />
                    เวลา {q.time}
                  </div>
                  <div className="quiz-meta-r">
                    ทำแล้ว {q.progress}%
                    <br />
                    ภายในวันที่ {q.dueDate}
                  </div>
                </div>
                <div className="mini-bar-wrap">
                  <div className="mini-bar-fill" style={{ width: `${q.progress}%` }} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  )
}