import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '@/components/Header'
import { BackIcon, PlusCircle } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'
import { generateQuestions } from '@/lib/aiApi'
import { supabase } from '@/lib/supabase'

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

const LEVELS = [
  { value: '1', label: 'ง่าย' },
  { value: '2', label: 'ปานกลาง' },
  { value: '3', label: 'ยาก' },
]

export default function CreateQuiz() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [count, setCount] = useState('10')
  const [level, setLevel] = useState('2')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const unit = UNITS.find(u => u.id === selectedUnit)

  async function handleGenerate() {
    if (!unit || !user) return
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. เรียก AI backend ให้สร้างโจทย์ตามหน่วยที่เลือก
      const aiResult = await generateQuestions(unit.title, level, Number(count) || 10)

      // 2. บันทึกลงตาราง homework ใน Supabase
      const { error } = await supabase.from('homework').insert({
        h_name: `${unit.chapter}: ${unit.title}`,
        h_tid: user.id,
        h_subject: unit.title,
        h_bloom_taxonomy: null,
        h_type: 'auto_generated',
        h_score: 100,
        h_enable_streak: true,
        h_content: {
          questions: aiResult.questions,
          start_date: startDate,
          end_date: endDate,
          description,
        },
      })

      if (error) {
        console.error('Supabase insert error:', error)
        setErrorMsg('บันทึกแบบฝึกหัดไม่สำเร็จ กรุณาลองใหม่')
        return
      }

      // สำเร็จ — กลับไปหน้าแดชบอร์ดครู
      navigate('/teacher')
    } catch (err) {
      console.error('Generate error:', err)
      setErrorMsg('สร้างโจทย์ไม่สำเร็จ กรุณาลองใหม่ (อาจเกิดจากเซิร์ฟเวอร์ AI กำลังปลุกตัวเอง รอสักครู่แล้วลองอีกครั้ง)')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="field">
              <label className="label">ระดับความยาก</label>
              <select
                className="input"
                value={level}
                onChange={e => setLevel(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
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

          {errorMsg && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--danger, #e05252)' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              className="btn btn-primary"
              style={{ padding: '16px 40px', fontSize: 16, opacity: selectedUnit && !loading ? 1 : 0.4 }}
              disabled={!selectedUnit || loading}
              onClick={handleGenerate}
            >
              <PlusCircle />
              {loading ? 'กำลังสร้างโจทย์... (อาจใช้เวลาสักครู่)' : 'สร้างโจทย์อัตโนมัติ'}
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
