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

// Protected Route: GET courses (Instructors see their own, Students ONLY see published courses)
app.get(
  "/api/courses",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const courses = await prisma.courses.findMany({
        where:
          req.user.role === "instructor"
            ? { instructor_id: req.user.id }
            : { status: "published" },
        include: {
          users: {
            select: { full_name: true, email: true, role: true },
          },
        },
      });

      res.json({ success: true, data: courses });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch courses" });
    }
  },
);

// Protected Route: GET a single course with Modules and Lessons
// ---------------------------------------------------------
// Protected Route: GET courses (Optimized Payload)
// ---------------------------------------------------------
app.get(
  "/api/courses",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const courses = await prisma.courses.findMany({
        where:
          req.user.role === "instructor"
            ? { instructor_id: req.user.id }
            : { status: "published" },
        // 🚀 OPTIMIZATION: Only grab the fields the Dashboard card actually uses!
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          users: {
            select: { full_name: true }, // We don't need the instructor's email or password hash here!
          },
        },
      });

      res.json({ success: true, data: courses });
    } catch (error) {
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
      const course = await prisma.courses.findUnique({
        where: { id: req.params.id },
        // 🚀 OPTIMIZATION: Strip out database timestamps and unnecessary relational IDs
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
      const courseId = req.params.id;
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
      const courseId = req.params.id;

      // 1. Verify the course belongs to this exact instructor
      const course = await prisma.courses.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      if (course.instructor_id !== req.user.id) {
        res
          .status(403)
          .json({
            success: false,
            message: "Unauthorized to delete this course",
          });
        return;
      }

      // 2. Delete it! (Your SQL schema handles the cascading deletes perfectly)
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
      const { courseId } = req.params;
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
      const { moduleId } = req.params;
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
      await prisma.lessons.deleteMany({ where: { module_id: req.params.id } });
      await prisma.modules.delete({ where: { id: req.params.id } });
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
      await prisma.lessons.delete({ where: { id: req.params.id } });
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
      const { courseId } = req.params;
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
      const { courseId } = req.params;

      // 1. Verify the course actually belongs to the instructor making the request
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

      // 2. Fetch the enrollments and pull in the user's name and email
      const enrollments = await prisma.enrollments.findMany({
        where: { course_id: courseId },
        include: {
          // 🚀 THE FIX: Changed 'users' to 'user'
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
// POST: Toggle Lesson Completion (Students only)
// ---------------------------------------------------------
app.post(
  "/api/lessons/:lessonId/progress",
  authenticateToken,
  requireRole("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;

      // Check if they already completed it
      const existingProgress = await prisma.lessonProgress.findUnique({
        where: {
          user_id_lesson_id: { user_id: userId, lesson_id: lessonId },
        },
      });

      if (existingProgress) {
        // If it exists, they are "un-completing" it
        await prisma.lessonProgress.delete({
          where: { id: existingProgress.id },
        });
        res.json({
          success: true,
          message: "Lesson marked as incomplete",
          completed: false,
        });
      } else {
        // If it doesn't exist, mark it as complete
        await prisma.lessonProgress.create({
          data: { user_id: userId, lesson_id: lessonId },
        });
        res.json({
          success: true,
          message: "Lesson marked as complete",
          completed: true,
        });
      }
    } catch (error) {
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
      const { courseId } = req.params;
      const userId = req.user.id;

      // Find all completed lessons for this specific user in this specific course
      const progress = await prisma.lessonProgress.findMany({
        where: {
          user_id: userId,
          lesson: {
            module: {
              course_id: courseId,
            },
          },
        },
        select: { lesson_id: true },
      });

      // Map it down to just a simple array of IDs (e.g., ["lesson-1-id", "lesson-2-id"])
      const completedLessonIds = progress.map((p) => p.lesson_id);

      res.json({ success: true, data: completedLessonIds });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);
app.listen(PORT, () => {
  console.log(`Server is running live on http://localhost:${PORT}`);
});
