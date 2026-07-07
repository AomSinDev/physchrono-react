import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import { BackIcon, PlusCircle } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'

// หน่วยการเรียนฟิสิกส์
const UNITS = [
  { id: 1,  title: 'การเคลื่อนที่แนวตรง',       chapter: 'บทที่ 1' },
  { id: 2,  title: 'การเคลื่อนที่แบบโพรเจกไทล์', chapter: 'บทที่ 2' },
  { id: 3,  title: 'กฎการเคลื่อนที่ของนิวตัน',   chapter: 'บทที่ 3' },
  { id: 4,  title: 'สมดุลกล',                    chapter: 'บทที่ 4' },
  { id: 5,  title: 'งานและพลังงาน',              chapter: 'บทที่ 5' },
  { id: 6,  title: 'โมเมนตัมและการชน',           chapter: 'บทที่ 6' },
  { id: 7,  title: 'การหมุนและโมเมนต์',          chapter: 'บทที่ 7' },
  { id: 8,  title: 'คลื่นกล',                    chapter: 'บทที่ 8' },
  { id: 9,  title: 'แสงและทัศนูปกรณ์',           chapter: 'บทที่ 9' },
  { id: 10, title: 'ไฟฟ้าสถิต',                  chapter: 'บทที่ 10' },
  { id: 11, title: 'ไฟฟ้ากระแส',                 chapter: 'บทที่ 11' },
  { id: 12, title: 'แม่เหล็กไฟฟ้า',              chapter: 'บทที่ 12' },
]

export default function CreateQuiz() {
  const { user } = useAuth()

  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [count, setCount] = useState('10')
  const [description, setDescription] = useState('')

  const unit = UNITS.find(u => u.id === selectedUnit)

  return (
    <>
      <Header userName={user?.fullname || '—'} userRole="ครู" homeLink="/teacher" />

      <div className="container">
        <Link to="/teacher" className="btn-back">
          <BackIcon />
          ย้อนกลับ
        </Link>

        <div className="card">
          {/* หัวข้อ */}
          <div className="quiz-title-row">
            <div className="quiz-chip">{selectedUnit ?? '?'}</div>
            <div className="quiz-title-text">
              {unit
                ? <>สร้างแบบฝึกหัดใหม่: {unit.title}{' '}
                    <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 16 }}>({unit.chapter})</span>
                  </>
                : <span style={{ color: 'var(--text-3)' }}>เลือกหน่วยการเรียนก่อน</span>
              }
            </div>
          </div>

          {/* ฟอร์มรายละเอียด */}
          <div className="form-grid">
            <div className="field">
              <label className="label">วันที่เริ่ม</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">วันที่สิ้นสุด</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">📚 หน่วยการเรียน</label>
              <select
                className="input"
                value={selectedUnit ?? ''}
                onChange={e => setSelectedUnit(e.target.value ? Number(e.target.value) : null)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- เลือกหน่วย --</option>
                {UNITS.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.chapter} · {u.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">กำหนดข้อ</label>
              <input
                className="input"
                type="number"
                min={1} max={50}
                value={count}
                onChange={e => setCount(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">คำอธิบาย</label>
            <textarea
              className="textarea"
              placeholder="ระบุเนื้อหา จุดประสงค์ และคำชี้แจงสำหรับนักเรียน..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              className="btn btn-primary"
              style={{ padding: '16px 40px', fontSize: 16, opacity: selectedUnit ? 1 : 0.4 }}
              disabled={!selectedUnit}
            >
              <PlusCircle />
              สร้างโจทย์อัตโนมัติ
            </button>
          </div>
          {!selectedUnit && (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--text-3)' }}>
              กรุณาเลือกหน่วยการเรียนก่อน
            </div>
          )}
        </div>
      </div>
    </>
  )
}