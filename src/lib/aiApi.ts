const AI_API_URL = import.meta.env.VITE_AI_API_URL

export async function generateQuestions(topic: string, level: string, amount = 5) {
  const res = await fetch(`${AI_API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level, amount }),
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

export async function uploadPdf(files: FileList) {
  const formData = new FormData()
  Array.from(files).forEach(f => formData.append('file', f))
  const res = await fetch(`${AI_API_URL}/upload-pdf`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('อัปโหลด PDF ไม่สำเร็จ')
  return res.json()
}

export async function listPdfs() {
  const res = await fetch(`${AI_API_URL}/list-pdfs`)
  if (!res.ok) throw new Error('ดึงรายการ PDF ไม่สำเร็จ')
  return res.json()
}
