import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const cookieToken = (req as any).cookies?.token as string | undefined;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
