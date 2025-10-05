import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth";
import { checkIdempotency } from "../middleware/idempotency";
import DocumentModel from "../models/Document";

const router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
  prisma?: any;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/documents";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, TXT, and images are allowed."
        )
      );
    }
  },
});

// POST /api/docs - Upload document
router.post(
  "/",
  authenticateToken,
  checkIdempotency,
  upload.single("document"),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: "FIELD_REQUIRED",
            field: "document",
            message: "Document file is required",
          },
        });
      }

      const { isPrivate = true } = req.body;
      const shareToken = isPrivate === "false" ? null : uuidv4();

      // Create document record
      const document = await DocumentModel.create({
        userId: req.user!.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        isPrivate: isPrivate === "true",
        shareToken,
      });

      res.status(201).json({
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadDate: document.uploadDate,
        isPrivate: document.isPrivate,
        shareToken: document.shareToken,
      });
    } catch (error) {
      console.error("Document upload error:", error);

      // Clean up uploaded file if database operation failed
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to upload document",
        },
      });
    }
  }
);

// GET /api/docs - List documents with pagination
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const [documents, totalCount] = await Promise.all([
      DocumentModel.find({ userId: req.user!.id })
        .select(
          "originalName fileType fileSize uploadDate isPrivate shareToken processedAt"
        )
        .sort({ uploadDate: -1 })
        .skip(offset)
        .limit(limit),
      DocumentModel.countDocuments({ userId: req.user!.id }),
    ]);

    const nextOffset = offset + limit < totalCount ? offset + limit : null;

    res.json({
      items: documents,
      next_offset: nextOffset,
      total: totalCount,
    });
  } catch (error) {
    console.error("Document list error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch documents",
      },
    });
  }
});

// GET /api/docs/:id - Get specific document
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const document = await DocumentModel.findOne({
        _id: id,
        userId: req.user!.id,
      }).select(
        "originalName fileType fileSize uploadDate isPrivate shareToken processedAt content"
      );

      if (!document) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Document not found",
          },
        });
      }

      res.json(document);
    } catch (error) {
      console.error("Document fetch error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch document",
        },
      });
    }
  }
);

// GET /api/docs/shared/:token - Access shared document
router.get("/shared/:token", async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = req.params;

    const document = await DocumentModel.findOne({ shareToken: token }).select(
      "originalName fileType fileSize uploadDate isPrivate shareToken processedAt content"
    );

    if (!document) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Shared document not found",
        },
      });
    }

    res.json(document);
  } catch (error) {
    console.error("Shared document fetch error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch shared document",
      },
    });
  }
});

export default router;
