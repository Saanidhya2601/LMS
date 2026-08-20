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
app.get(
  "/api/courses/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const course = await prisma.courses.findUnique({
        where: { id: req.params.id },
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
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

// DELETE: Remove a course (Instructors only)
app.delete(
  "/api/courses/:id",
  authenticateToken,
  requireRole("instructor"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;

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
          message: "You can only delete your own courses",
        });
        return;
      }

      await prisma.courses.delete({
        where: { id: courseId },
      });

      res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
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
          users: {
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
      console.error("FETCH STUDENTS ERROR:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },
);
app.listen(PORT, () => {
  console.log(`Server is running live on http://localhost:${PORT}`);
});
