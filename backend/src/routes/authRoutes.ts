import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// REGISTER ROUTE
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, role } = req.body;

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.users.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
        role: role || "student",
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// LOGIN ROUTE
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
