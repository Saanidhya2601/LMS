import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";

// This function takes the required role (e.g., 'instructor') and returns a middleware function
export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if the user exists and if their role matches the requirement
    if (!req.user || req.user.role !== role) {
      res.status(403).json({
        success: false,
        message:
          "Access Denied: You do not have the required permissions for this action",
      });
      return;
    }

    // If they have the right role, let them through!
    next();
  };
};
