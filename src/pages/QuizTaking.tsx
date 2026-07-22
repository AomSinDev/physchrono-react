import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { BackIcon } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface Choice {
  letter: string
  text: string
}

interface Question {
  id: number
  question: string
  choices: Choice[]
  correct: string
  answer: string
}

interface HomeworkContent {
  questions: Question[]
  start_date?: string
  end_date?: string
  description?: string
}

interface ActiveRow {
  a_id: number
  a_sid: number
  a_type: string
  a_score: number
  a_homework: HomeworkContent
  homework: { h_name: string } | { h_name: string }[] | null
}

function formatDate(value?: string) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  } catch {
    return value
  }
}

export default function QuizTaking() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const activeId = (location.state as { activeId?: number } | null)?.activeId

  const [active, setActive] = useState<ActiveRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; correctCount: number; total: number } | null>(null)

  useEffect(() => {
    if (!activeId) {
      setErrorMsg('ไม่พบชุดฝึกที่เลือก กรุณากลับไปเลือกใหม่จากหน้าหลัก')
      setLoading(false)
      return
    }
    loadActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  async function loadActive() {
    setLoading(true)
    const { data, error } = await supabase
      .from('actives')
      .select('a_id, a_sid, a_type, a_score, a_homework, homework(h_name)')
      .eq('a_id', activeId)
      .maybeSingle()

    if (error || !data) {
      setErrorMsg('โหลดชุดฝึกไม่สำเร็จ กรุณาลองใหม่')
      setLoading(false)
      return
    }

    setActive(data as ActiveRow)

    // ถ้าเคยส่งคำตอบไปแล้ว ให้แสดงผลลัพธ์เดิมทันที
    if (data.a_type === 'submitted' || data.a_type === 'done') {
      const total = (data.a_homework?.questions ?? []).length
      setResult({ score: data.a_score ?? 0, correctCount: 0, total })
    }

    setLoading(false)
  }

  const homeworkName = (() => {
    const hw = Array.isArray(active?.homework) ? active?.homework[0] : active?.homework
    return hw?.h_name ?? 'ชุดฝึก'
  })()

  const questions = active?.a_homework?.questions ?? []
  const currentQuestion = questions[currentIndex]
  const selected = currentQuestion ? answers[currentQuestion.id] : undefined
  const answeredCount = Object.keys(answers).length
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  function selectChoice(letter: string) {
    if (!currentQuestion || submitting || result) return
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: letter }))
  }

  function goNext() {
    if (currentQuestion && selected) {
      if (selected === currentQuestion.correct) {
        setStreak(s => {
          const next = s + 1
          setBestStreak(b => Math.max(b, next))
          return next
        })
      } else {
        setStreak(0)
      }
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      handleSubmit()
    }
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  async function handleSubmit() {
    if (!active || !user) return
    setSubmitting(true)
    try {
      const total = questions.length
      const correctCount = questions.filter(q => answers[q.id] === q.correct).length
      const score = total > 0 ? Math.round((correctCount / total) * 100) : 0

      const { error } = await supabase
        .from('actives')
        .update({
          a_score: score,
          a_type: 'submitted',
          a_best_streak: bestStreak,
          a_submitted_at: new Date().toISOString(),
        })
        .eq('a_id', active.a_id)

      if (error) {
        console.error('submit error:', error)
        setErrorMsg('ส่งคำตอบไม่สำเร็จ กรุณาลองใหม่')
        return
      }

      setResult({ score, correctCount, total })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header userName={user?.fullname || '—'} userRole="นักเรียน" homeLink="/student" />
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
            กำลังโหลดชุดฝึก...
          </div>
        </div>
      </>
    )
  }

  if (errorMsg && !active) {
    return (
      <>
        <Header userName={user?.fullname || '—'} userRole="นักเรียน" homeLink="/student" />
        <div className="container">
          <Link to="/student" className="btn-back">
            <BackIcon />
            ย้อนกลับ
          </Link>
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
            ⚠️ {errorMsg}
          </div>
        </div>
      </>
    )
  }

  // หน้าแสดงผลลัพธ์หลังส่งคำตอบ
  if (result) {
    return (
      <>
        <Header userName={user?.fullname || '—'} userRole="นักเรียน" homeLink="/student" />
        <div className="container">
          <Link to="/student" className="btn-back">
            <BackIcon />
            ย้อนกลับ
          </Link>

          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {result.score >= 80 ? '🎉' : result.score >= 50 ? '👍' : '📘'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              คะแนน {result.score} / 100
            </div>
            {result.total > 0 && (
              <div style={{ color: 'var(--text-3)', marginBottom: 24 }}>
                ตอบถูก {result.correctCount} จาก {result.total} ข้อ
              </div>
            )}
            <Link to="/student" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </>
    )
  }

  if (!currentQuestion) {
    return (
      <>
        <Header userName={user?.fullname || '—'} userRole="นักเรียน" homeLink="/student" />
        <div className="container">
          <Link to="/student" className="btn-back">
            <BackIcon />
            ย้อนกลับ
          </Link>
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
            ชุดฝึกนี้ยังไม่มีโจทย์
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header userName={user?.fullname || '—'} userRole="นักเรียน" homeLink="/student" />

      <div className="container">
        <Link to="/student" className="btn-back">
          <BackIcon />
          ย้อนกลับ
        </Link>

        <div className="quiz-header-banner">
          <div className="quiz-banner-num">{currentIndex + 1}</div>
          <div className="quiz-banner-title">ชุดฝึก : {homeworkName}</div>
          {active?.a_homework?.description && (
            <div className="quiz-banner-sub">{active.a_homework.description}</div>
          )}
        </div>

        <div className="quiz-status">
          <div className="quiz-status-row">
            <span className="left">
              เริ่ม {formatDate(active?.a_homework?.start_date)}
            </span>
            <span className="right">
              ทำแล้ว {progressPct}% · ภายในวันที่ {formatDate(active?.a_homework?.end_date)}
            </span>
          </div>
          <div className="progress-bar-wrap" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="streak-mini">
              <span className="flame">🔥</span>
              <span>Streak ปัจจุบัน: {streak} ข้อติด</span>
            </div>
          </div>
        </div>

        <div className="question-box">
          <div className="q-num">ข้อที่ {currentIndex + 1} / {questions.length}</div>
          <div className="q-text">{currentQuestion.question}</div>

          <div className="choices">
            {currentQuestion.choices.map((c) => (
              <div
                key={c.letter}
                className={`choice ${selected === c.letter ? 'selected' : ''}`}
                onClick={() => selectChoice(c.letter)}
              >
                <div className="choice-letter">{c.letter}</div>
                <div>{c.text}</div>
              </div>
            ))}
          </div>

          <div className="quiz-footer">
            <button className="btn btn-ghost" onClick={goPrev} disabled={currentIndex === 0}>
              ← ข้อก่อนหน้า
            </button>
            <button
              className="btn btn-primary"
              onClick={goNext}
              disabled={!selected || submitting}
            >
              {submitting
                ? 'กำลังส่ง...'
                : currentIndex < questions.length - 1
                  ? 'ข้อถัดไป →'
                  : 'ส่งคำตอบ'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
