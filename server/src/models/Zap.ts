import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IZapTrigger {
  app: string;
  event: string;
}

export interface IZapAction {
  app: string;
  type: string;
  mapping: Record<string, string>;
}

export interface IZap extends Document {
  userId: Types.ObjectId;
  name: string;
  enabled: boolean;
  trigger: IZapTrigger;
  action: IZapAction;
  createdAt: Date;
  updatedAt: Date;
}

const ZapSchema = new Schema<IZap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    trigger: {
      app: { type: String, required: true },
      event: { type: String, required: true },
    },
    action: {
      app: { type: String, required: true },
      type: { type: String, required: true },
      mapping: { type: Map, of: String, default: {} },
    },
  },
  { timestamps: true }
);

export const Zap = mongoose.model<IZap>('Zap', ZapSchema);
