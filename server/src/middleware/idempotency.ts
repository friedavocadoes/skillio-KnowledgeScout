import { Request, Response, NextFunction } from "express";
import IdempotencyKey from "../models/IdempotencyKey";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  prisma?: any;
}

export const checkIdempotency = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const idempotencyKey = req.headers["idempotency-key"] as string;

  if (!idempotencyKey) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required for idempotency",
      },
    });
  }

  try {
    // Check if key already exists
    const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });

    if (existingKey) {
      // Key exists, return cached response
      return res.status(409).json({
        error: {
          code: "IDEMPOTENCY_KEY_EXISTS",
          message: "Request already processed",
        },
      });
    }

    // Store the key for future requests
    await IdempotencyKey.create({
      key: idempotencyKey,
      userId: req.user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    next();
  } catch (error) {
    console.error("Idempotency check error:", error);
    next();
  }
};
