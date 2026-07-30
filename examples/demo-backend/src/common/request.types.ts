import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface DemoRequest extends Request {
  requestId: string;
  user?: AuthenticatedUser;
  organizationId?: string;
}
