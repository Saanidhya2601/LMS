import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Express Request type to include our custom user payload
export interface AuthRequest extends Request {
  user?: any;
}

// Define the secret from your environment variables
const secret = process.env.JWT_SECRET as string;

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  // The token usually comes in the format: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Access Denied: No token provided" });
    return; // Ensure we exit the function
  }

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
      return; // Ensure we exit the function
    }
    req.user = user;
    next(); // Token is valid, proceed to the actual route
  });
};
