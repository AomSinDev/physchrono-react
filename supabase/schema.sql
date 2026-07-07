-- ==========================================================
-- Phys-Chrono Database Schema for Supabase (PostgreSQL)
-- ==========================================================
-- วิธีใช้:
-- 1. เปิด Supabase Dashboard → SQL Editor → New Query
-- 2. Copy ทั้งหมดในไฟล์นี้ → Paste
-- 3. กด Run
-- 4. ตรวจสอบ Tables ใน Database tab
-- ==========================================================

-- ลบตารางเก่า (ถ้ามี) เพื่อรันใหม่ได้
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS actives CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS medias CASCADE;
DROP TABLE IF EXISTS classs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- ==========================================================
-- 1. teachers
-- ==========================================================
CREATE TABLE teachers (
  t_id BIGSERIAL PRIMARY KEY,
  t_fullname VARCHAR(255) NOT NULL,
  t_username VARCHAR(255) UNIQUE NOT NULL,
  t_email VARCHAR(255) UNIQUE NOT NULL,
  t_password VARCHAR(255) NOT NULL,
  t_gender VARCHAR(255),
  t_age INTEGER,
  t_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 2. students (มี Streak fields)
-- ==========================================================
CREATE TABLE students (
  s_id BIGSERIAL PRIMARY KEY,
  s_fullname VARCHAR(255) NOT NULL,
  s_username VARCHAR(255) UNIQUE NOT NULL,
  s_email VARCHAR(255) UNIQUE NOT NULL,
  s_password VARCHAR(255) NOT NULL,
  s_gender VARCHAR(255),
  s_age INTEGER,
  s_best_streak INTEGER DEFAULT 0,
  s_streak_points INTEGER DEFAULT 0,
  s_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 3. classs (ห้องเรียน)
-- ==========================================================
CREATE TABLE classs (
  c_id BIGSERIAL PRIMARY KEY,
  c_name VARCHAR(255) NOT NULL,
  c_tid BIGINT NOT NULL REFERENCES teachers(t_id) ON DELETE CASCADE,
  c_join_code VARCHAR(20) UNIQUE NOT NULL,
  c_students JSONB DEFAULT '[]'::jsonb,
  c_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 4. medias (สื่อการสอน)
-- ==========================================================
CREATE TABLE medias (
  m_id BIGSERIAL PRIMARY KEY,
  m_name VARCHAR(255) NOT NULL,
  m_tid BIGINT NOT NULL REFERENCES teachers(t_id) ON DELETE CASCADE,
  m_period VARCHAR(255),
  m_media JSONB DEFAULT '{}'::jsonb,
  m_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 5. homework (ชุดฝึก - มี Streak toggle)
-- ==========================================================
CREATE TABLE homework (
  h_id BIGSERIAL PRIMARY KEY,
  h_name VARCHAR(255) NOT NULL,
  h_tid BIGINT NOT NULL REFERENCES teachers(t_id) ON DELETE CASCADE,
  h_bloom_taxonomy VARCHAR(255),
  h_subject VARCHAR(255),
  h_type VARCHAR(255),
  h_score INTEGER,
  h_enable_streak BOOLEAN DEFAULT TRUE,
  h_content JSONB DEFAULT '{}'::jsonb,
  h_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 6. actives (การบ้านที่นักเรียนกำลังทำ/ทำเสร็จ - มี Streak data)
-- ==========================================================
CREATE TABLE actives (
  a_id BIGSERIAL PRIMARY KEY,
  a_sid BIGINT NOT NULL REFERENCES students(s_id) ON DELETE CASCADE,
  a_cid BIGINT NOT NULL REFERENCES classs(c_id) ON DELETE CASCADE,
  a_hid BIGINT NOT NULL REFERENCES homework(h_id) ON DELETE CASCADE,
  a_homework JSONB DEFAULT '{}'::jsonb,
  a_score INTEGER DEFAULT 0,
  a_best_streak INTEGER DEFAULT 0,
  a_type VARCHAR(255) DEFAULT 'in_progress',
  a_submitted_at TIMESTAMPTZ
);

-- ==========================================================
-- 7. history (ประวัติส่งงาน - มี Streak)
-- ==========================================================
CREATE TABLE history (
  his_id BIGSERIAL PRIMARY KEY,
  his_cid BIGINT NOT NULL REFERENCES classs(c_id) ON DELETE CASCADE,
  his_tid BIGINT NOT NULL REFERENCES teachers(t_id) ON DELETE CASCADE,
  his_sid BIGINT NOT NULL REFERENCES students(s_id) ON DELETE CASCADE,
  his_aid BIGINT NOT NULL REFERENCES actives(a_id) ON DELETE CASCADE,
  his_best_streak INTEGER DEFAULT 0,
  his_time TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 8. news (ข่าวสาร)
-- ==========================================================
CREATE TABLE news (
  n_id BIGSERIAL PRIMARY KEY,
  n_cid BIGINT NOT NULL REFERENCES classs(c_id) ON DELETE CASCADE,
  n_content TEXT,
  n_time TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- Indexes (เพิ่มความเร็วการ query)
-- ==========================================================
CREATE INDEX idx_classs_tid ON classs(c_tid);
CREATE INDEX idx_medias_tid ON medias(m_tid);
CREATE INDEX idx_homework_tid ON homework(h_tid);
CREATE INDEX idx_actives_sid ON actives(a_sid);
CREATE INDEX idx_actives_cid ON actives(a_cid);
CREATE INDEX idx_actives_hid ON actives(a_hid);
CREATE INDEX idx_history_sid ON history(his_sid);
CREATE INDEX idx_history_cid ON history(his_cid);
CREATE INDEX idx_news_cid ON news(n_cid);
CREATE INDEX idx_students_username ON students(s_username);
CREATE INDEX idx_teachers_username ON teachers(t_username);

-- ==========================================================
-- Row Level Security (RLS) - เริ่มต้นเปิดให้ทุกคนใช้ได้
-- ในระบบจริงควรปรับให้รัดกุมกว่านี้
-- ==========================================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE actives ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Policies เริ่มต้น: อนุญาตทุก operation (เพื่อให้ test ได้)
-- ⚠️ ในระบบ production ต้องเขียน policies ที่รัดกุมกว่านี้
CREATE POLICY "allow_all_teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_classs" ON classs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_medias" ON medias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_homework" ON homework FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_actives" ON actives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_history" ON history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_news" ON news FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- Seed Data (ข้อมูลตัวอย่างสำหรับทดสอบ)
-- ==========================================================

-- ครู demo
INSERT INTO teachers (t_fullname, t_username, t_email, t_password, t_gender, t_age) VALUES
('Max Teacher', 'maxteacher', 'max@school.ac.th', 'password123', 'M', 35),
('Anna Sensei', 'anna', 'anna@school.ac.th', 'password123', 'F', 30);

-- นักเรียน demo (พร้อม Streak data)
INSERT INTO students (s_fullname, s_username, s_email, s_password, s_gender, s_age, s_best_streak, s_streak_points) VALUES
('Max Iestappen', 'maxs', 'maxs@school.ac.th', 'password123', 'M', 17, 15, 40),
('Lewis Hamilton', 'lewish', 'lewis@school.ac.th', 'password123', 'M', 17, 8, 22),
('Charles Leclerc', 'charlesl', 'charles@school.ac.th', 'password123', 'M', 17, 12, 35);

-- ห้องเรียน demo
INSERT INTO classs (c_name, c_tid, c_join_code) VALUES
('ม.6/1 ฟิสิกส์', 1, 'PHY601'),
('ม.6/2 ฟิสิกส์', 1, 'PHY602');

-- ชุดฝึก demo
INSERT INTO homework (h_name, h_tid, h_bloom_taxonomy, h_subject, h_type, h_score, h_enable_streak, h_content) VALUES
('การเคลื่อนที่', 1, 'Apply', 'กลศาสตร์', 'ปรนัย', 10, TRUE, '{"questions":[]}'),
('สมดุลกล', 1, 'Analyze', 'กลศาสตร์', 'ปรนัย', 10, TRUE, '{"questions":[]}'),
('งานและพลังงาน', 1, 'Apply', 'กลศาสตร์', 'ปรนัย', 10, TRUE, '{"questions":[]}');

-- เสร็จ
SELECT 'Schema created successfully! Tables: ' || count(*) AS result
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('teachers','students','classs','medias','homework','actives','history','news');
