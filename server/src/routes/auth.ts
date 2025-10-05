import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// simplified checks; removed express-validator
import User from "../models/User";

const router = express.Router();

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email) {
      return res.status(400).json({
        error: {
          code: "FIELD_REQUIRED",
          field: "email",
          message: "Email is required",
        },
      });
    }
    if (!password) {
      return res.status(400).json({
        error: {
          code: "FIELD_REQUIRED",
          field: "password",
          message: "Password is required",
        },
      });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters",
        },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: {
          code: "USER_EXISTS",
          message: "User with this email already exists",
        },
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userDoc = await User.create({ email, passwordHash });
    const user = {
      id: userDoc.id,
      email: userDoc.email,
      createdAt: userDoc.createdAt,
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create user",
      },
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email) {
      return res.status(400).json({
        error: {
          code: "FIELD_REQUIRED",
          field: "email",
          message: "Email is required",
        },
      });
    }
    if (!password) {
      return res.status(400).json({
        error: {
          code: "FIELD_REQUIRED",
          field: "password",
          message: "Password is required",
        },
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      (user as any).passwordHash
    );
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({
      user: {
        id: (user as any).id,
        email: (user as any).email,
        createdAt: (user as any).createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to authenticate user",
      },
    });
  }
});

export default router;
