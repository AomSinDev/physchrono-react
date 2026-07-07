import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import Particles from '@/components/Particles'
import Login from '@/pages/Login'
import TeacherDashboard from '@/pages/TeacherDashboard'
import CreateQuiz from '@/pages/CreateQuiz'
import StudentDashboard from '@/pages/StudentDashboard'
import QuizTaking from '@/pages/QuizTaking'
import Register from '@/pages/Register'
import CalendarPage from '@/pages/CalendarPage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <Particles />
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher/create-quiz" element={<CreateQuiz />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/quiz" element={<QuizTaking />} />
          <Route path="/student/calendar" element={<CalendarPage role="student" />} />
          <Route path="/teacher/calendar" element={<CalendarPage role="teacher" />} />
          <Route path="/student/profile" element={<ProfilePage />} />
          <Route path="/teacher/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
