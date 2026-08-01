const AI_API_URL = import.meta.env.VITE_AI_API_URL

export async function generateQuestions(
  topic: string,
  level: string,
  amount = 5,
  context = ''
) {
  const res = await fetch(`${AI_API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level, amount, context }),
  })
  if (!res.ok) throw new Error('สร้างโจทย์ไม่สำเร็จ')
  return res.json()
}

export async function checkAnswer(question: string, answer: string, userAnswer: string) {
  const res = await fetch(`${AI_API_URL}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, user_answer: userAnswer }),
  })
  if (!res.ok) throw new Error('ตรวจคำตอบไม่สำเร็จ')
  return res.json()
}

// อ่านข้อความจากไฟล์ PDF (ไม่บันทึกที่ server ใช้แค่ตอนคำขอนี้)
export async function extractPdfText(files: FileList | File[]) {
  const formData = new FormData()
  Array.from(files).forEach(f => formData.append('file', f))
  const res = await fetch(`${AI_API_URL}/extract-pdf`, { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'อ่านไฟล์ PDF ไม่สำเร็จ')
  }
  return res.json() as Promise<{ text: string; files: string[]; chars: number }>
}
