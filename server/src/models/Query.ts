import mongoose, { Schema, Document as MDoc } from "mongoose";

export interface IQuery extends MDoc {
  userId: string;
  documentId: string;
  query: string;
  response: string;
  sources?: string;
  createdAt: Date;
  cachedUntil?: Date | null;
}

const QuerySchema = new Schema<IQuery>(
  {
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    query: { type: String, required: true },
    response: { type: String, required: true },
    sources: { type: String, default: "[]" },
    cachedUntil: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const QueryModel =
  mongoose.models.Query || mongoose.model<IQuery>("Query", QuerySchema);
export default QueryModel;
