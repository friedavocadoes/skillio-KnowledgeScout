import mongoose, { Schema, Document as MDoc } from "mongoose";

export interface IIdempotencyKey extends MDoc {
  key: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const IdempotencyKey =
  mongoose.models.IdempotencyKey ||
  mongoose.model<IIdempotencyKey>("IdempotencyKey", IdempotencyKeySchema);
export default IdempotencyKey;
