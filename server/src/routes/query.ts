import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { checkIdempotency } from "../middleware/idempotency";
import geminiService from "../services/gemini";
import DocumentModel from "../models/Document";
import QueryModel from "../models/Query";

const router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
  prisma?: any;
}

// POST /api/ask - Ask question about document
router.post(
  "/",
  [
    body("query").notEmpty().withMessage("Query is required"),
    body("documentId").notEmpty().withMessage("Document ID is required"),
    body("k")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("K must be between 1 and 10"),
  ],
  authenticateToken,
  checkIdempotency,
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: errors.array(),
          },
        });
      }

      const { query, documentId, k = 3 } = req.body;

      // Check if document exists and user has access
      const document = await DocumentModel.findOne({
        _id: documentId,
        userId: req.user!.id,
      });

      if (!document) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Document not found",
          },
        });
      }

      // Check if document has been processed
      if (!document.content) {
        return res.status(400).json({
          error: {
            code: "DOCUMENT_NOT_PROCESSED",
            message: "Document has not been processed yet",
          },
        });
      }

      // Check for cached query (60 second cache)
      const cachedQuery = await QueryModel.findOne({
        userId: req.user!.id,
        documentId,
        query,
        cachedUntil: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (cachedQuery) {
        return res.json({
          answer: cachedQuery.response,
          sources: cachedQuery.sources ? JSON.parse(cachedQuery.sources) : [],
          cached: true,
          cachedUntil: cachedQuery.cachedUntil,
        });
      }

      // Process query with Gemini
      const { answer, sources } = await geminiService.askQuestion(
        document.content,
        query,
        k
      );

      // Cache the response for 60 seconds
      const cachedUntil = new Date(Date.now() + 60 * 1000);
      await QueryModel.create({
        userId: req.user!.id,
        documentId,
        query,
        response: answer,
        sources: JSON.stringify(sources),
        cachedUntil,
      });

      res.json({
        answer,
        sources,
        cached: false,
        cachedUntil,
      });
    } catch (error) {
      console.error("Query processing error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process query",
        },
      });
    }
  }
);

export default router;
