import express, { type Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/authRoutes.js";

import {
  authenticateToken,
  type AuthRequest,
} from "./middlewares/authMiddleware.js";
import { requireRole } from "./middlewares/roleMiddleware.js";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public Auth Routes
app.use("/api/auth", authRoutes);

// ---------------------------------------------------------
// Protected Route: GET courses (Dashboard)
// ---------------------------------------------------------
app.get(
  "/api/courses",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      if (role === "instructor") {
        const courses = await prisma.courses.findMany({
          where: { instructor_id: userId },
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            status: true,
            users: {
              select: { full_name: true },
            },
          },
        });
        res.json({ success: true, data: courses });
      } else {
        const courses = await prisma.courses.findMany({
          where: { status: "published" },
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            status: true,
            users: {
              select: { full_name: true },
            },
            enrollments: {
              where: { user_id: userId },
              select: { progress_percentage: true, status: true },
            },
          },
        });

        const formattedCourses = courses.map((course) => {
          const enrollment = course.enrollments[0];
          return {
            ...course,
            is_enrolled: !!enrollment,
            progress_percentage: enrollment
              ? Number(enrollment.progress_percentage)
              : 0,
            enrollment_status: enrollment ? enrollment.status : null,
            enrollments: undefined,
          };
        });

        res.json({ success: true, data: formattedCourses });
      }
    } catch (error) {
      console.error("FETCH COURSES ERROR:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch courses" });
    }
  },
);

// ---------------------------------------------------------
// Protected Route: GET a single course (Optimized Payload)
// ---------------------------------------------------------
app.get(
  "/api/courses/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id as string;
      const course: any = await prisma.courses.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          level: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  video_url: true,
                  order: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      res.json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// Admin/Instructor Route: POST a new course
app.post(
  "/api/courses",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, category, level, status } = req.body;

      const generatedSlug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") +
        "-" +
        Math.floor(Math.random() * 1000);

      const newCourse = await prisma.courses.create({
        data: {
          title,
          slug: generatedSlug,
          description,
          category,
          level: level || "Beginner",
          status: status || "draft",
          instructor_id: req.user.id,
        },
      });

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: newCourse,
      });
    } catch (error) {
      console.error("COURSE CREATION ERROR:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// PUT: Update an existing course (Instructors only)
app.put(
  "/api/courses/:id",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id as string;
      const { title, slug, description, category, level, status } = req.body;

      const existingCourse = await prisma.courses.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      if (existingCourse.instructor_id !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "You can only edit your own courses",
        });
        return;
      }

      const updatedCourse = await prisma.courses.update({
        where: { id: courseId },
        data: { title, slug, description, category, level, status },
      });

      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// ---------------------------------------------------------
// DELETE: Delete a course (Instructors only)
// ---------------------------------------------------------
app.delete(
  "/api/courses/:id",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id as string;

      const course = await prisma.courses.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      if (course.instructor_id !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "Unauthorized to delete this course",
        });
        return;
      }

      await prisma.courses.delete({
        where: { id: courseId },
      });

      res.json({ success: true, message: "Course permanently deleted" });
    } catch (error) {
      console.error("DELETE COURSE ERROR:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete course" });
    }
  },
);

// POST: Add a Module to a Course (Instructors only)
app.post(
  "/api/courses/:courseId/modules",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const { title, order } = req.body;

      const course = await prisma.courses.findUnique({
        where: { id: courseId },
      });
      if (!course || course.instructor_id !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "Unauthorized or course not found",
        });
        return;
      }

      const newModule = await prisma.modules.create({
        data: { course_id: courseId, title, order },
      });

      res
        .status(201)
        .json({ success: true, message: "Module created", data: newModule });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// POST: Add a Lesson to a Module (Instructors only)
app.post(
  "/api/modules/:moduleId/lessons",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const moduleId = req.params.moduleId as string;
      const { title, video_url, content, order } = req.body;

      const newLesson = await prisma.lessons.create({
        data: { module_id: moduleId, title, video_url, content, order },
      });

      res
        .status(201)
        .json({ success: true, message: "Lesson created", data: newLesson });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// DELETE: Remove a Module (Instructors only)
app.delete(
  "/api/modules/:id",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const moduleId = req.params.id as string;
      await prisma.lessons.deleteMany({ where: { module_id: moduleId } });
      await prisma.modules.delete({ where: { id: moduleId } });
      res.json({ success: true, message: "Module deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// DELETE: Remove a Lesson (Instructors only)
app.delete(
  "/api/lessons/:id",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const lessonId = req.params.id as string;
      await prisma.lessons.delete({ where: { id: lessonId } });
      res.json({ success: true, message: "Lesson deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// POST: Enroll a Student in a Course (Students only)
app.post(
  "/api/courses/:courseId/enroll",
  authenticateToken,
  requireRole("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const studentId = req.user.id;

      const enrollment = await prisma.enrollments.create({
        data: { user_id: studentId, course_id: courseId },
      });

      res.status(201).json({
        success: true,
        message: "Successfully enrolled in course",
        data: enrollment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Enrollment failed. You may already be enrolled.",
      });
    }
  },
);

// ---------------------------------------------------------
// GET: Fetch students enrolled in a specific course (Instructors only)
// ---------------------------------------------------------
app.get(
  "/api/courses/:courseId/students",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;

      const course = await prisma.courses.findUnique({
        where: { id: courseId },
      });

      if (!course || course.instructor_id !== req.user.id) {
        res.status(403).json({
          success: false,
          message:
            "Unauthorized. You can only view students for your own courses.",
        });
        return;
      }

      const enrollments = await prisma.enrollments.findMany({
        where: { course_id: courseId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      res.json({ success: true, data: enrollments });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// ---------------------------------------------------------
// POST: Toggle Lesson Completion & Calculate Progress (Students only)
// ---------------------------------------------------------
app.post(
  "/api/lessons/:lessonId/progress",
  authenticateToken,
  requireRole("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const lessonId = req.params.lessonId as string;
      const userId = req.user.id;

      const lesson: any = await prisma.lessons.findUnique({
        where: { id: lessonId },
        include: { module: true },
      });

      if (!lesson) {
        res.status(404).json({ success: false, message: "Lesson not found" });
        return;
      }

      const courseId = lesson.module?.course_id || lesson.Modules?.course_id;

      const enrollment = await prisma.enrollments.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
        },
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: "You are not enrolled in this course.",
        });
        return;
      }

      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          enrollement_id: enrollment.id,
          lesson_id: lessonId,
        },
      });

      let isCompletedNow = false;

      if (existingProgress && existingProgress.is_completed) {
        await prisma.lessonProgress.update({
          where: { id: existingProgress.id },
          data: { is_completed: false, completed_at: null },
        });
        isCompletedNow = false;
      } else if (existingProgress) {
        await prisma.lessonProgress.update({
          where: { id: existingProgress.id },
          data: { is_completed: true, completed_at: new Date() },
        });
        isCompletedNow = true;
      } else {
        await prisma.lessonProgress.create({
          data: {
            enrollement_id: enrollment.id,
            lesson_id: lessonId,
            is_completed: true,
            completed_at: new Date(),
          } as any,
        });
        isCompletedNow = true;
      }

      const totalLessonsCount = await prisma.lessons.count({
        where: {
          module: {
            course_id: courseId,
          },
        },
      });

      const completedLessonsCount = await prisma.lessonProgress.count({
        where: {
          enrollement_id: enrollment.id,
          is_completed: true,
        },
      });

      const percentage =
        totalLessonsCount > 0
          ? Number(
              ((completedLessonsCount / totalLessonsCount) * 100).toFixed(2),
            )
          : 0;

      await prisma.enrollments.update({
        where: { id: enrollment.id },
        data: {
          progress_percentage: percentage,
          status: percentage === 100 ? "completed" : "active",
          completed_at: percentage === 100 ? new Date() : null,
        },
      });

      res.json({
        success: true,
        message: "Progress updated",
        completed: isCompletedNow,
        progress_percentage: percentage,
      });
    } catch (error) {
      console.error("PROGRESS ERROR:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// ---------------------------------------------------------
// GET: Fetch Student Progress for a Course (Students only)
// ---------------------------------------------------------
app.get(
  "/api/courses/:courseId/progress",
  authenticateToken,
  requireRole("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user.id;

      // 1. Find the specific enrollment
      const enrollment = await prisma.enrollments.findFirst({
        where: { user_id: userId, course_id: courseId },
      });

      if (!enrollment) {
        res.json({ success: true, data: [] });
        return;
      }

      // 2. Fetch completed lessons via the enrollement_id
      const progress = await prisma.lessonProgress.findMany({
        where: {
          enrollement_id: enrollment.id,
          is_completed: true,
        },
        select: { lesson_id: true },
      });

      const completedLessonIds = progress.map((p) => p.lesson_id);
      res.json({ success: true, data: completedLessonIds });
    } catch (error) {
      console.error("FETCH PROGRESS ERROR:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// ---------------------------------------------------------
// GET: Instructor Analytics Dashboard
// ---------------------------------------------------------
app.get(
  "/api/instructor/analytics",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const instructorId = req.user.id;

      const courses = await prisma.courses.findMany({
        where: { instructor_id: instructorId },
        include: {
          enrollments: {
            select: {
              progress_percentage: true,
              status: true,
            },
          },
        },
      });

      let totalEnrollments = 0;
      let totalProgressSum = 0;
      let completedEnrollments = 0;

      const courseStats = courses.map((course) => {
        const enrollmentsCount = course.enrollments.length;
        totalEnrollments += enrollmentsCount;

        let courseProgressSum = 0;
        let courseCompleted = 0;

        course.enrollments.forEach((enrollment) => {
          courseProgressSum += enrollment.progress_percentage;
          totalProgressSum += enrollment.progress_percentage;

          if (enrollment.status === "completed") {
            courseCompleted += 1;
            completedEnrollments += 1;
          }
        });

        const courseAvgProgress =
          enrollmentsCount > 0
            ? (courseProgressSum / enrollmentsCount).toFixed(1)
            : 0;

        return {
          id: course.id,
          title: course.title,
          status: course.status,
          enrollments: enrollmentsCount,
          completions: courseCompleted,
          avg_progress: Number(courseAvgProgress),
        };
      });

      const overallAvgProgress =
        totalEnrollments > 0
          ? (totalProgressSum / totalEnrollments).toFixed(1)
          : 0;

      res.json({
        success: true,
        data: {
          overview: {
            total_courses: courses.length,
            total_enrollments: totalEnrollments,
            total_completions: completedEnrollments,
            overall_avg_progress: Number(overallAvgProgress),
          },
          course_breakdown: courseStats,
        },
      });
    } catch (error) {
      console.error("ANALYTICS ERROR:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch analytics" });
    }
  },
);

// 1. POST: Create a Quiz (Instructors only)
app.post(
  "/api/lessons/:lessonId/quiz",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const lessonId = req.params.lessonId as string;
      const { pass_score, questions } = req.body;

      const existingQuiz = await prisma.quizzes.findUnique({
        where: { lesson_id: lessonId },
      });

      if (existingQuiz) {
        await prisma.quizzes.delete({ where: { id: existingQuiz.id } });
      }

      const newQuiz = await prisma.quizzes.create({
        data: {
          lesson_id: lessonId,
          pass_score: pass_score || 80,
          questions: {
            create: questions.map((q: any) => ({
              text: q.text,
              options: {
                create: q.options.map((o: any) => ({
                  text: o.text,
                  is_correct: o.is_correct,
                })),
              },
            })),
          },
        },
        include: { questions: { include: { options: true } } },
      });

      res.status(201).json({ success: true, data: newQuiz });
    } catch (error) {
      console.error("CREATE QUIZ ERROR:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// 2. GET: Fetch Quiz for a Lesson (Students & Instructors)
app.get(
  "/api/lessons/:lessonId/quiz",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const lessonId = req.params.lessonId as string;

      const quiz: any = await prisma.quizzes.findUnique({
        where: { lesson_id: lessonId },
        include: { questions: { include: { options: true } } },
      });

      if (!quiz) {
        res.json({ success: true, data: null });
        return;
      }

      if (req.user.role === "student") {
        const sanitizedQuiz = {
          ...quiz,
          questions: (quiz.questions || []).map((q: any) => ({
            ...q,
            options: (q.options || []).map((o: any) => ({
              id: o.id,
              text: o.text,
            })),
          })),
        };
        res.json({ success: true, data: sanitizedQuiz });
        return;
      }

      res.json({ success: true, data: quiz });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// 3. POST: Submit Quiz Answers (Students only)
app.post(
  "/api/quizzes/:quizId/submit",
  authenticateToken,
  requireRole("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const quizId = req.params.quizId as string;
      const { answers } = req.body;

      const quiz: any = await prisma.quizzes.findUnique({
        where: { id: quizId },
        include: { questions: { include: { options: true } } },
      });

      if (!quiz) {
        res.status(404).json({ success: false, message: "Quiz not found" });
        return;
      }

      let correctCount = 0;
      const questionsList = quiz.questions || [];
      const totalQuestions = questionsList.length;

      questionsList.forEach((question: any) => {
        const correctOption = (question.options || []).find(
          (o: any) => o.is_correct,
        );
        if (correctOption && answers.includes(correctOption.id)) {
          correctCount++;
        }
      });

      const score =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
      const passed = score >= quiz.pass_score;

      res.json({
        success: true,
        data: {
          score,
          passed,
          pass_score: quiz.pass_score,
          correctCount,
          totalQuestions,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);

// =========================================================
// 👤 USER PROFILE & SETTINGS ROUTES
// =========================================================

app.get(
  "/api/users/profile",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          created_at: true,
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error("PROFILE FETCH ERROR:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch profile" });
    }
  },
);

app.put(
  "/api/users/profile",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { full_name, email } = req.body;

      const existingUser = await prisma.users.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== req.user.id) {
        res.status(400).json({
          success: false,
          message: "Email is already in use by another account.",
        });
        return;
      }

      const updatedUser = await prisma.users.update({
        where: { id: req.user.id },
        data: { full_name, email },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update profile" });
    }
  },
);
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running live on http://localhost:${PORT}`);
  });
}

// Keep this export for Vercel Serverless deployments
export default app;
