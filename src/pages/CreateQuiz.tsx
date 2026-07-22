import { useState, useEffect } from 'react'
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

interface ClassRow {
  c_id: number
  c_name: string
  c_join_code: string
  c_students: number[]
}

function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function CreateQuiz() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [count, setCount] = useState('10')
  const [level, setLevel] = useState('2')
  const [description, setDescription] = useState('')

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [newClassName, setNewClassName] = useState('')
  const [creatingClass, setCreatingClass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const unit = UNITS.find(u => u.id === selectedUnit)

  useEffect(() => {
    if (user) loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadClasses() {
    if (!user) return
    const { data, error } = await supabase
      .from('classs')
      .select('c_id, c_name, c_join_code, c_students')
      .eq('c_tid', user.id)
      .order('c_created_at', { ascending: false })

    if (!error && data) {
      setClasses(data as ClassRow[])
      if (data.length > 0 && selectedClassId === null) {
        setSelectedClassId(data[0].c_id)
      }
    }
  }

  async function handleCreateClass() {
    if (!newClassName.trim() || !user) return
    setCreatingClass(true)
    try {
      const { data, error } = await supabase
        .from('classs')
        .insert({
          c_name: newClassName.trim(),
          c_tid: user.id,
          c_join_code: generateJoinCode(),
          c_students: [],
        })
        .select()
        .single()

      if (error) {
        console.error(error)
        setErrorMsg('สร้างห้องเรียนไม่สำเร็จ')
        return
      }

      setNewClassName('')
      await loadClasses()
      if (data) setSelectedClassId(data.c_id)
    } finally {
      setCreatingClass(false)
    }
  }

  async function handleGenerate() {
    if (!unit || !user) return
    if (!selectedClassId) {
      setErrorMsg('กรุณาเลือกหรือสร้างห้องเรียนก่อน')
      return
    }
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. เรียก AI backend ให้สร้างโจทย์ตามหน่วยที่เลือก
      const aiResult = await generateQuestions(unit.title, level, Number(count) || 10)

      const homeworkContent = {
        questions: aiResult.questions,
        start_date: startDate,
        end_date: endDate,
        description,
      }

      // 2. บันทึกลงตาราง homework ใน Supabase — ขอ id กลับมาด้วย
      const { data: hwData, error: hwError } = await supabase
        .from('homework')
        .insert({
          h_name: `${unit.chapter}: ${unit.title}`,
          h_tid: user.id,
          h_subject: unit.title,
          h_bloom_taxonomy: null,
          h_type: 'auto_generated',
          h_score: 100,
          h_enable_streak: true,
          h_content: homeworkContent,
        })
        .select()
        .single()

      if (hwError || !hwData) {
        console.error('Supabase insert error:', hwError)
        setErrorMsg('บันทึกแบบฝึกหัดไม่สำเร็จ กรุณาลองใหม่')
        return
      }

      // 3. มอบหมายงานให้นักเรียนทุกคนในห้องที่เลือก (สร้างแถวใน actives)
      const targetClass = classes.find(c => c.c_id === selectedClassId)
      const studentIds: number[] = targetClass?.c_students ?? []

      if (studentIds.length > 0) {
        const activesRows = studentIds.map(sid => ({
          a_sid: sid,
          a_cid: selectedClassId,
          a_hid: hwData.h_id,
          a_homework: homeworkContent,
          a_score: 0,
          a_type: 'assigned',
        }))
        const { error: actError } = await supabase.from('actives').insert(activesRows)
        if (actError) {
          console.error('actives insert error:', actError)
          setErrorMsg('สร้างชุดฝึกสำเร็จ แต่มอบหมายให้นักเรียนไม่สำเร็จบางส่วน')
          return
        }
        setSuccessMsg(`สร้างชุดฝึกและมอบหมายให้นักเรียน ${studentIds.length} คนเรียบร้อยแล้ว`)
      } else {
        setSuccessMsg('สร้างชุดฝึกสำเร็จ แต่ห้องนี้ยังไม่มีนักเรียนเข้าร่วม (แชร์รหัสห้องให้นักเรียนก่อน)')
      }

      setTimeout(() => navigate('/teacher'), 1500)
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

          {/* เลือกห้องเรียน */}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">🏫 มอบหมายให้ห้องเรียน</label>
            {classes.length > 0 ? (
              <select
                className="input"
                value={selectedClassId ?? ''}
                onChange={e => setSelectedClassId(Number(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                {classes.map(c => (
                  <option key={c.c_id} value={c.c_id}>
                    {c.c_name} · รหัส {c.c_join_code} · นักเรียน {c.c_students?.length ?? 0} คน
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>
                ยังไม่มีห้องเรียน สร้างห้องใหม่ก่อนด้านล่าง
              </div>
            )}

            {/* สร้างห้องเรียนใหม่แบบเร็ว */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="input"
                placeholder="ชื่อห้องเรียนใหม่ เช่น ม.6/1 ฟิสิกส์"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!newClassName.trim() || creatingClass}
                onClick={handleCreateClass}
              >
                {creatingClass ? 'กำลังสร้าง...' : '+ สร้างห้อง'}
              </button>
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
          {successMsg && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--success, #3fb950)' }}>
              ✅ {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              className="btn btn-primary"
              style={{ padding: '16px 40px', fontSize: 16, opacity: selectedUnit && selectedClassId && !loading ? 1 : 0.4 }}
              disabled={!selectedUnit || !selectedClassId || loading}
              onClick={handleGenerate}
            >
              <PlusCircle />
              {loading ? 'กำลังสร้างโจทย์... (อาจใช้เวลาสักครู่)' : 'สร้างโจทย์อัตโนมัติ'}
            </button>
          </div>
          {(!selectedUnit || !selectedClassId) && (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--text-3)' }}>
              กรุณาเลือกหน่วยการเรียนและห้องเรียนก่อน
            </div>
          )}
        </div>
      </div>
    </>
  )
}
