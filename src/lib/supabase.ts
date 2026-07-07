import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials! Check your .env file')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== Types ตามตารางใน Supabase =====

export interface Teacher {
  t_id: number
  t_fullname: string
  t_username: string
  t_email: string
  t_gender?: string
  t_age?: number
  t_created_at?: string
}

export interface Student {
  s_id: number
  s_fullname: string
  s_username: string
  s_email: string
  s_gender?: string
  s_age?: number
  s_best_streak: number
  s_streak_points: number
  s_created_at?: string
}

export interface Classroom {
  c_id: number
  c_name: string
  c_tid: number
  c_join_code: string
  c_students: number[]
  c_created_at?: string
}

export interface Homework {
  h_id: number
  h_name: string
  h_tid: number
  h_bloom_taxonomy?: string
  h_subject?: string
  h_type?: string
  h_score?: number
  h_enable_streak: boolean
  h_content: any
  h_created_at?: string
}

export interface Active {
  a_id: number
  a_sid: number
  a_cid: number
  a_hid: number
  a_homework: any
  a_score: number
  a_best_streak: number
  a_type: string
  a_submitted_at?: string
}

export interface History {
  his_id: number
  his_cid: number
  his_tid: number
  his_sid: number
  his_aid: number
  his_best_streak: number
  his_time: string
}

export interface News {
  n_id: number
  n_cid: number
  n_content?: string
  n_time: string
}

// ===== User type สำหรับ auth context =====
export type UserRole = 'teacher' | 'student'

export interface AuthUser {
  id: number
  role: UserRole
  fullname: string
  username: string
  email: string
}
