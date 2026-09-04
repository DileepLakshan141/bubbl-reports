export interface AuthenticatedUser {
  userId: string | number;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
