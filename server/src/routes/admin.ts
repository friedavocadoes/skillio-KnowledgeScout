import express from "express";
import { authenticateToken } from "../middleware/auth";
import geminiService from "../services/gemini";
import fs from "fs";
import path from "path";
import DocumentModel from "../models/Document";
import QueryModel from "../models/Query";

const router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
  prisma?: PrismaClient;
}

// POST /api/index/rebuild - Rebuild document index
router.post(
  "/rebuild",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get all unprocessed documents for the user
      const documents = await DocumentModel.find({
        userId: req.user!.id,
        processedAt: null,
      });

      const results = [];

      for (const doc of documents) {
        try {
          const filePath = path.join("uploads/documents", doc.filename);

          if (!fs.existsSync(filePath)) {
            results.push({
              documentId: doc.id,
              status: "error",
              message: "File not found",
            });
            continue;
          }

          // Process document with Gemini
          const content = await geminiService.processDocument(
            filePath,
            doc.fileType
          );

          // Update document with processed content
          await DocumentModel.updateOne(
            { _id: doc.id },
            { $set: { content, processedAt: new Date() } }
          );

          results.push({
            documentId: doc.id,
            status: "success",
            message: "Document processed successfully",
          });
        } catch (error) {
          console.error(`Error processing document ${doc.id}:`, error);
          results.push({
            documentId: doc.id,
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      res.json({
        message: "Document processing completed",
        results,
        processed: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "error").length,
      });
    } catch (error) {
      console.error("Rebuild index error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to rebuild index",
        },
      });
    }
  }
);

// GET /api/index/stats - Get index statistics
router.get(
  "/stats",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const [
        totalDocuments,
        processedDocuments,
        unprocessedDocuments,
        totalQueries,
        recentQueries,
      ] = await Promise.all([
        DocumentModel.countDocuments({ userId: req.user!.id }),
        DocumentModel.countDocuments({
          userId: req.user!.id,
          processedAt: { $ne: null },
        }),
        DocumentModel.countDocuments({
          userId: req.user!.id,
          processedAt: null,
        }),
        QueryModel.countDocuments({ userId: req.user!.id }),
        QueryModel.find({ userId: req.user!.id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("query createdAt documentId")
          .lean()
          .then(async (qs) => {
            const docIds = qs.map((q) => q.documentId);
            const docs = await DocumentModel.find({ _id: { $in: docIds } })
              .select("originalName")
              .lean();
            const map = new Map(
              docs.map((d) => [d._id.toString(), d.originalName])
            );
            return qs.map((q) => ({
              query: q.query,
              createdAt: q.createdAt,
              document: {
                originalName: map.get(q.documentId.toString()) || "",
              },
            }));
          }),
      ]);

      res.json({
        documents: {
          total: totalDocuments,
          processed: processedDocuments,
          unprocessed: unprocessedDocuments,
          processingRate:
            totalDocuments > 0
              ? ((processedDocuments / totalDocuments) * 100).toFixed(2)
              : 0,
        },
        queries: {
          total: totalQueries,
          recent: recentQueries,
        },
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch statistics",
        },
      });
    }
  }
);

export default router;
