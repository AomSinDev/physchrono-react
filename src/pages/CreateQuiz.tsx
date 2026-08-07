import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '@/components/Header'
import { BackIcon, PlusCircle } from '@/components/Icons'
import { useAuth } from '@/hooks/useAuth'
import { generateQuestions, extractPdfText } from '@/lib/aiApi'
import { supabase } from '@/lib/supabase'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ── PDF ให้ AI อ่านประกอบการสร้างโจทย์ ──
  const [pdfContext, setPdfContext] = useState('')
  const [pdfFileNames, setPdfFileNames] = useState<string[]>([])
  const [pdfExtracting, setPdfExtracting] = useState(false)
  const [pdfError, setPdfError] = useState('')

  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // ── ตัวอย่างโจทย์ก่อนเผยแพร่ ──
  const [previewQuestions, setPreviewQuestions] = useState<Question[] | null>(null)

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

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setPdfExtracting(true)
    setPdfError('')
    try {
      const result = await extractPdfText(files)
      setPdfContext(result.text)
      setPdfFileNames(result.files)
    } catch (err) {
      console.error(err)
      setPdfError(err instanceof Error ? err.message : 'อ่านไฟล์ PDF ไม่สำเร็จ')
      setPdfContext('')
      setPdfFileNames([])
    } finally {
      setPdfExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function clearPdf() {
    setPdfContext('')
    setPdfFileNames([])
    setPdfError('')
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
    setPreviewQuestions(null)

    try {
      const aiResult = await generateQuestions(unit.title, level, Number(count) || 10, pdfContext)
      const qs: Question[] = aiResult.questions ?? []
      if (qs.length === 0) {
        setErrorMsg('ไม่สามารถสร้างโจทย์ได้ กรุณาลองใหม่')
        return
      }
      setPreviewQuestions(qs)
    } catch (err) {
      console.error('Generate error:', err)
      setErrorMsg('สร้างโจทย์ไม่สำเร็จ กรุณาลองใหม่ (อาจเกิดจากเซิร์ฟเวอร์ AI กำลังปลุกตัวเอง รอสักครู่แล้วลองอีกครั้ง)')
    } finally {
      setLoading(false)
    }
  }

  function handleRemoveQuestion(id: number) {
    setPreviewQuestions(prev => (prev ? prev.filter(q => q.id !== id) : prev))
  }

  function handleDiscardPreview() {
    setPreviewQuestions(null)
    setErrorMsg('')
    setSuccessMsg('')
  }

  async function handlePublish() {
    if (!unit || !user || !previewQuestions || previewQuestions.length === 0) return
    if (!selectedClassId) {
      setErrorMsg('กรุณาเลือกหรือสร้างห้องเรียนก่อน')
      return
    }
    setPublishing(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const homeworkContent = {
        questions: previewQuestions,
        start_date: startDate,
        end_date: endDate,
        description,
        source_files: pdfFileNames,
      }

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
        setSuccessMsg(`เผยแพร่และมอบหมายให้นักเรียน ${studentIds.length} คนเรียบร้อยแล้ว`)
      } else {
        setSuccessMsg('เผยแพร่ชุดฝึกสำเร็จ แต่ห้องนี้ยังไม่มีนักเรียนเข้าร่วม (แชร์รหัสห้องให้นักเรียนก่อน)')
      }

      setTimeout(() => navigate('/teacher'), 1500)
    } catch (err) {
      console.error('Publish error:', err)
      setErrorMsg('เผยแพร่ไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setPublishing(false)
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
          <div className="field" style={{ marginTop: 16, opacity: previewQuestions ? 0.5 : 1, pointerEvents: previewQuestions ? 'none' : 'auto' }}>
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

          {/* แนบ PDF ให้ AI อ่านประกอบ */}
          <div className="field" style={{ marginTop: 16, opacity: previewQuestions ? 0.5 : 1, pointerEvents: previewQuestions ? 'none' : 'auto' }}>
            <label className="label">📄 แนบไฟล์ PDF ให้ AI อ้างอิง (ไม่บังคับ)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handlePdfChange}
              disabled={pdfExtracting}
              style={{ fontSize: 13, color: 'var(--text-3)' }}
            />
            {pdfExtracting && (
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
                กำลังอ่านไฟล์...
              </div>
            )}
            {pdfError && (
              <div style={{ fontSize: 13, color: 'var(--danger, #e05252)', marginTop: 6 }}>
                ⚠️ {pdfError}
              </div>
            )}
            {pdfFileNames.length > 0 && !pdfExtracting && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: 'var(--success, #3fb950)', marginTop: 6,
              }}>
                ✅ แนบแล้ว: {pdfFileNames.join(', ')} ({pdfContext.length.toLocaleString()} ตัวอักษร)
                <button
                  type="button"
                  onClick={clearPdf}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ลบไฟล์
                </button>
              </div>
            )}
          </div>

          {/* ฟอร์มรายละเอียด */}
          <div className="form-grid" style={{ opacity: previewQuestions ? 0.5 : 1, pointerEvents: previewQuestions ? 'none' : 'auto' }}>
            <div className="field">
              <label className="label">วันที่เริ่ม</label>
              <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">วันที่สิ้นสุด</label>
              <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
                  <option key={u.id} value={u.id}>{u.chapter} · {u.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">กำหนดข้อ</label>
              <input className="input" type="number" min={1} max={50} value={count} onChange={e => setCount(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">ระดับความยาก</label>
              <select className="input" value={level} onChange={e => setLevel(e.target.value)} style={{ cursor: 'pointer' }}>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field" style={{ opacity: previewQuestions ? 0.5 : 1, pointerEvents: previewQuestions ? 'none' : 'auto' }}>
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

          {!previewQuestions && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: '16px 40px', fontSize: 16, opacity: selectedUnit && selectedClassId && !loading ? 1 : 0.4 }}
                  disabled={!selectedUnit || !selectedClassId || loading}
                  onClick={handleGenerate}
                >
                  <PlusCircle />
                  {loading ? 'กำลังสร้างโจทย์... (อาจใช้เวลาสักครู่)' : 'สร้างโจทย์ (ดูตัวอย่างก่อนเผยแพร่)'}
                </button>
              </div>
              {(!selectedUnit || !selectedClassId) && (
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--text-3)' }}>
                  กรุณาเลือกหน่วยการเรียนและห้องเรียนก่อน
                </div>
              )}
            </>
          )}
        </div>

        {previewQuestions && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                👀 ตัวอย่างโจทย์ก่อนเผยแพร่ ({previewQuestions.length} ข้อ)
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
              ตรวจสอบโจทย์ ตัวเลือก และเฉลยด้านล่าง — ลบข้อที่ไม่ต้องการได้ก่อนกดเผยแพร่ นักเรียนจะยังไม่เห็นโจทย์นี้จนกว่าจะกด "เผยแพร่ให้นักเรียน"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {previewQuestions.map((q, i) => (
                <div
                  key={q.id}
                  style={{
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                    borderRadius: 12, padding: 16, position: 'relative',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q.id)}
                    title="ลบข้อนี้ออกจากตัวอย่าง"
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(255, 82, 82, 0.12)', border: '1px solid rgba(255, 82, 82, 0.3)',
                      color: '#ff6b6b', cursor: 'pointer', fontSize: 14, lineHeight: '26px',
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>ข้อที่ {i + 1}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, paddingRight: 32 }}>
                    {q.question}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {q.choices.map(c => {
                      const isCorrect = c.letter === q.correct
                      return (
                        <div
                          key={c.letter}
                          style={{
                            display: 'flex', gap: 8, alignItems: 'flex-start',
                            fontSize: 14, padding: '6px 10px', borderRadius: 8,
                            background: isCorrect ? 'rgba(63, 185, 80, 0.12)' : 'transparent',
                            border: isCorrect ? '1px solid rgba(63, 185, 80, 0.35)' : '1px solid transparent',
                            color: isCorrect ? '#3fb950' : 'var(--text-2, #ccc)',
                            fontWeight: isCorrect ? 700 : 400,
                          }}
                        >
                          <span>{c.letter}.</span>
                          <span>{c.text}</span>
                          {isCorrect && <span style={{ marginLeft: 'auto' }}>✓ เฉลย</span>}
                        </div>
                      )
                    })}
                  </div>
                  {q.answer && (
                    <div style={{ fontSize: 13, color: 'var(--text-3)', borderTop: '1px dashed var(--border, rgba(255,255,255,0.1))', paddingTop: 8 }}>
                      💡 {q.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {previewQuestions.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14, padding: '20px 0' }}>
                ไม่เหลือโจทย์ในชุดนี้แล้ว กรุณาสร้างใหม่
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={handleDiscardPreview} disabled={publishing}>
                ← กลับไปแก้ไข / สร้างใหม่
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '14px 32px', fontSize: 16, opacity: previewQuestions.length > 0 && !publishing ? 1 : 0.4 }}
                disabled={previewQuestions.length === 0 || publishing}
                onClick={handlePublish}
              >
                {publishing ? 'กำลังเผยแพร่...' : '✅ เผยแพร่ให้นักเรียน'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
