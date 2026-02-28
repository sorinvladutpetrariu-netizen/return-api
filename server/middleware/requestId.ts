import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(req: RequestWithId, _res: Response, next: NextFunction): void {
  req.requestId = crypto.randomUUID();
  next();
}

export function getRequestId(req: Request): string {
  return (req as RequestWithId).requestId ?? 'unknown';
}
