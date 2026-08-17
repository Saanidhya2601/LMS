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

    // 1. Check if user already exists (using prisma.users)
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Save user to database
    // FIX 1: Changed prisma.user.create to prisma.users.create
    const newUser = await prisma.users.create({
      data: {
        full_name,
        email,
        // FIX 2: Changed 'password' to 'password_hash' to match your SQL schema
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
    console.error("REGISTER ERROR:", error); // <-- Added this so future errors print in your terminal!
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// LOGIN ROUTE
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    // 2. Compare the passwords (Matches password_hash correctly!)
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
