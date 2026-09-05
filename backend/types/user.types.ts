import { Role } from '../src/generated/prisma/browser';

export interface AuthenticatedUser {
  userId: string | number;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export interface RequestUser {
  userId: number;
  role: Role;
}
