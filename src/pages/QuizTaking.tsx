import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { BackIcon } from '@/components/Icons'

const choices = [
  { letter: 'A', text: 'เชือกซ้าย 196 N, เชือกขวา 98 N' },
  { letter: 'B', text: 'เชือกซ้าย 245 N, เชือกขวา 49 N' },
  { letter: 'C', text: 'เชือกซ้าย 196 N, เชือกขวา 98 N' },
  { letter: 'D', text: 'เชือกซ้าย 98 N, เชือกขวา 196 N' },
]

export default function QuizTaking() {
  const [selected, setSelected] = useState<string>('C')

  return (
    <>
      <Header userName="Max Iestappen" userRole="นักเรียน" homeLink="/student" />

      <div className="container">
        <Link to="/student" className="btn-back">
          <BackIcon />
          ย้อนกลับ
        </Link>

        <div className="quiz-header-banner">
          <div className="quiz-banner-num">4</div>
          <div className="quiz-banner-title">ชุดฝึก : สมดุลกล</div>
          <div className="quiz-banner-sub">
            สภาพสมดุล: สมดุลต่อการเลื่อนตำแหน่ง และสมดุลต่อการหมุน (โมเมนต์)
          </div>
        </div>

        <div className="quiz-status">
          <div className="quiz-status-row">
            <span className="left">วันที่ 24/12/26 · เวลา 13:00</span>
            <span className="right">ทำแล้ว 40% · ภายในวันที่ 31/12/26</span>
          </div>
          <div className="progress-bar-wrap" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: '40%' }}></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="streak-mini">
              <span className="flame">🔥</span>
              <span>Streak ปัจจุบัน: 3 ข้อติด</span>
            </div>
          </div>
        </div>

        <div className="question-box">
          <div className="q-num">ข้อที่ 4</div>
          <div className="q-text">
            คานสม่ำเสมอมวล 10 kg ยาว 4 m ถูกแขวนไว้ในแนวนอนด้วยเชือกเส้นเล็กๆ 2
            เส้นที่ปลายทั้งสองข้าง (ซ้ายและขวา) เมื่อมีน้ำหนัก 20 kg วางที่ตำแหน่ง 1 m
            จากปลายซ้าย จงหาแรงตึงในเชือกแต่ละเส้น
          </div>

          <div className="choices">
            {choices.map((c) => (
              <div
                key={c.letter}
                className={`choice ${selected === c.letter ? 'selected' : ''}`}
                onClick={() => setSelected(c.letter)}
              >
                <div className="choice-letter">{c.letter}</div>
                <div>{c.text}</div>
              </div>
            ))}
          </div>

          <div className="quiz-footer">
            <button className="btn btn-ghost">← ข้อก่อนหน้า</button>
            <button className="btn btn-primary">ข้อถัดไป →</button>
          </div>
        </div>
      </div>
    </>
  )
}
