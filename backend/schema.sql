CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Enum types ----------
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE video_status AS ENUM ('pending', 'processing', 'ready', 'failed');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE lesson_content_type AS ENUM ('video', 'text');

-- ---------- updated_at trigger helper ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(255) NOT NULL,
  role           user_role NOT NULL DEFAULT 'student',
  avatar_url     TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title          VARCHAR(255) NOT NULL,
  slug           VARCHAR(280) UNIQUE NOT NULL,
  description    TEXT,
  thumbnail_url  TEXT,
  status         course_status NOT NULL DEFAULT 'draft',
  category       VARCHAR(100),
  level          VARCHAR(50),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_instructor ON courses (instructor_id);
CREATE INDEX idx_courses_status     ON courses (status);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- MODULES (course sections)
-- ============================================================
CREATE TABLE modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  position    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, position)
);

CREATE INDEX idx_modules_course ON modules (course_id);

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VIDEOS (upload + processing lifecycle, decoupled from lessons)
-- ============================================================
CREATE TABLE videos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  s3_bucket          VARCHAR(255) NOT NULL,
  raw_s3_key         VARCHAR(500) NOT NULL,
  processed_s3_key   VARCHAR(500),
  hls_manifest_key   VARCHAR(500),
  thumbnail_key      VARCHAR(500),
  status             video_status NOT NULL DEFAULT 'pending',
  duration_seconds   INTEGER,
  original_filename  VARCHAR(500),
  file_size_bytes    BIGINT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_status ON videos (status);

CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  video_id      UUID REFERENCES videos(id) ON DELETE SET NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  content_type  lesson_content_type NOT NULL DEFAULT 'video',
  position      INTEGER NOT NULL,
  is_preview    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, position)
);

CREATE INDEX idx_lessons_module ON lessons (module_id);
CREATE INDEX idx_lessons_video  ON lessons (video_id);

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id            UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status               enrollment_status NOT NULL DEFAULT 'active',
  progress_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0,
  enrolled_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user   ON enrollments (user_id);
CREATE INDEX idx_enrollments_course ON enrollments (course_id);

-- ============================================================
-- LESSON PROGRESS
-- ============================================================
CREATE TABLE lesson_progress (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id           UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id               UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  watch_time_seconds      INTEGER NOT NULL DEFAULT 0,
  last_position_seconds   INTEGER NOT NULL DEFAULT 0,
  is_completed            BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at            TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, lesson_id)
);

CREATE INDEX idx_progress_enrollment ON lesson_progress (enrollment_id);
CREATE INDEX idx_progress_lesson     ON lesson_progress (lesson_id);

CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();