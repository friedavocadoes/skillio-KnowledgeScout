import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";
import queryRoutes from "./routes/query";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? false : ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Connect to MongoDB
async function connectMongo() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/knowledgescout";
  await mongoose.connect(mongoUri, {
    // options are inferred in modern mongoose
  });
  console.log("📦 Connected to MongoDB");
}

connectMongo().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Rate limiting: 60 requests per minute per user
const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  message: {
    error: {
      code: "RATE_LIMIT",
      message: "Rate limit exceeded. Maximum 60 requests per minute.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(userRateLimit);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/ask", queryRoutes);
app.use("/api/index", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);

  if (err.code === "RATE_LIMIT") {
    return res.status(429).json({
      error: {
        code: "RATE_LIMIT",
        message: "Rate limit exceeded",
      },
    });
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
