import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  login: string;
  accessToken: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true },
    login: { type: String, required: true },
    accessToken: { type: String, required: true },
    avatarUrl: String,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
