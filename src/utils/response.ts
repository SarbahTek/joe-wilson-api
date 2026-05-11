import { Response } from 'express';
import { PaginationMeta } from './pagination';

export function ok<T>(res: Response, data: T, meta?: PaginationMeta) {
  return res.status(200).json({ success: true, data, ...(meta && { meta }) });
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data });
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function badRequest(res: Response, error: string) {
  return res.status(400).json({ success: false, error });
}

export function unauthorized(res: Response, error = 'Unauthorized') {
  return res.status(401).json({ success: false, error });
}

export function forbidden(res: Response, error = 'Forbidden') {
  return res.status(403).json({ success: false, error });
}

export function notFound(res: Response, error = 'Not found') {
  return res.status(404).json({ success: false, error });
}

export function serverError(res: Response, error = 'Something went wrong') {
  return res.status(500).json({ success: false, error });
}
