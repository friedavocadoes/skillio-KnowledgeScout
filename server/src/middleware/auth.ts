import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  prisma?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Access token required",
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verify user still exists
    const user = await User.findById(decoded.userId).select("_id email");

    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
        },
      });
    }

    req.user = { id: user.id, email: user.email } as any;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid token",
      },
    });
  }
};
