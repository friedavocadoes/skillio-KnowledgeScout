import mongoose, { Schema, Document as MDoc } from "mongoose";

export interface IDocument extends MDoc {
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  isPrivate: boolean;
  shareToken?: string | null;
  content?: string | null;
  processedAt?: Date | null;
}

const DocumentSchema = new Schema<IDocument>({
  userId: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: true },
  shareToken: {
    type: String,
    default: null,
    index: true,
    sparse: true,
    unique: false,
  },
  content: { type: String, default: null },
  processedAt: { type: Date, default: null },
});

const DocumentModel =
  mongoose.models.Document ||
  mongoose.model<IDocument>("Document", DocumentSchema);
export default DocumentModel;
