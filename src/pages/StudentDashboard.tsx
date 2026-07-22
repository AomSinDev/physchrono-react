import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import Counter from '@/components/Counter'
import { supabase } from '@/lib/supabase'
import {
  HomeIcon,
  CalendarIcon,
  OpenBook,
  StarIcon,
  TrophyIcon,
  FlameIcon,
  CheckCircle,
} from '@/components/Icons'

interface QuizCard {
  activeId: number
  num: number
  title: string
  date: string
  time: string
  progress: number
  dueDate: string
  score: number
}

interface StudentStats {
  totalDone: number
  totalScore: number
  bestScore: number
  streak: number
  overallProgress: number
  quizCards: QuizCard[]
}

const EMPTY_STATS: StudentStats = {
  totalDone: 0,
  totalScore: 0,
  bestScore: 0,
  streak: 0,
  overallProgress: 0,
  quizCards: [],
}

function formatDate(value?: string) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  } catch {
    return value
  }
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StudentStats>(EMPTY_STATS)
  const [loadingData, setLoadingData] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joinMsg, setJoinMsg] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (user) loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadStats() {
    if (!user) return
    setLoadingData(true)

    const { data, error } = await supabase
      .from('actives')
      .select('a_id, a_score, a_type, a_homework, homework(h_name, h_created_at)')
      .eq('a_sid', user.id)
      .order('a_id', { ascending: false })

    if (error) {
      console.error('load actives error:', error)
      setLoadingData(false)
      return
    }

    type ActiveRow = {
      a_id: number
      a_score: number
      a_type: string
      a_homework: { start_date?: string; end_date?: string } | null
      homework: { h_name: string; h_created_at: string } | { h_name: string; h_created_at: string }[] | null
    }

    const rows = (data ?? []) as ActiveRow[]

    const quizCards: QuizCard[] = rows.map((row, i) => {
      const hw = Array.isArray(row.homework) ? row.homework[0] : row.homework
      const progress =
        row.a_type === 'submitted' || row.a_type === 'done' ? 100 :
        row.a_type === 'in_progress' ? 50 : 0

      return {
        activeId: row.a_id,
        num: i + 1,
        title: hw?.h_name ?? 'ชุดฝึก',
        date: formatDate(row.a_homework?.start_date || hw?.h_created_at),
        time: '-',
        progress,
        dueDate: formatDate(row.a_homework?.end_date),
        score: row.a_score ?? 0,
      }
    })

    const doneCards = quizCards.filter(q => q.progress === 100)
    const totalScore = doneCards.reduce((sum, q) => sum + q.score, 0)
    const bestScore = doneCards.length > 0 ? Math.max(...doneCards.map(q => q.score)) : 0
    const overallProgress = quizCards.length > 0
      ? Math.round(quizCards.reduce((sum, q) => sum + q.progress, 0) / quizCards.length)
      : 0

    setStats({
      totalDone: doneCards.length,
      totalScore,
      bestScore,
      streak: user.role === 'student' ? 0 : 0, // TODO: ดึงจาก s_streak_points ถ้าต้องการ
      overallProgress,
      quizCards,
    })
    setLoadingData(false)
  }

  async function handleJoinClass() {
    if (!joinCode.trim() || !user) return
    setJoining(true)
    setJoinMsg('')
    try {
      const code = joinCode.trim().toUpperCase()
      const { data: cls, error } = await supabase
        .from('classs')
        .select('c_id, c_students')
        .eq('c_join_code', code)
        .maybeSingle()

      if (error || !cls) {
        setJoinMsg('ไม่พบห้องเรียนที่ใช้รหัสนี้ กรุณาตรวจสอบอีกครั้ง')
        return
      }

      const currentStudents: number[] = cls.c_students ?? []
      if (currentStudents.includes(user.id)) {
        setJoinMsg('คุณเข้าร่วมห้องนี้อยู่แล้ว')
        return
      }

      const { error: updateError } = await supabase
        .from('classs')
        .update({ c_students: [...currentStudents, user.id] })
        .eq('c_id', cls.c_id)

      if (updateError) {
        setJoinMsg('เข้าร่วมห้องเรียนไม่สำเร็จ กรุณาลองใหม่')
        return
      }

      setJoinMsg('เข้าร่วมห้องเรียนสำเร็จ! 🎉')
      setJoinCode('')
      loadStats()
    } finally {
      setJoining(false)
    }
  }

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
        {/* เข้าร่วมห้องเรียน */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">เข้าร่วมห้องเรียนด้วยรหัส</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              className="input"
              placeholder="กรอกรหัสห้องเรียน เช่น PHY601"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{ flex: 1, textTransform: 'uppercase' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={!joinCode.trim() || joining}
              onClick={handleJoinClass}
            >
              {joining ? 'กำลังเข้าร่วม...' : 'เข้าร่วมห้อง'}
            </button>
          </div>
          {joinMsg && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>{joinMsg}</div>
          )}
        </div>

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
              <Link
                to="/student/quiz"
                state={{ activeId: q.activeId }}
                className="quiz-card"
                key={q.activeId}
              >
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
