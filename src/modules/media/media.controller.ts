import { Request, Response } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { s3 } from '../../config/s3';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/authenticate';
import { ok, created, notFound, badRequest, serverError } from '../../utils/response';
import { FileType } from '@prisma/client';

function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return FileType.image;
  if (mimeType.startsWith('audio/')) return FileType.audio;
  if (mimeType.startsWith('video/')) return FileType.video;
  if (mimeType === 'application/pdf' || mimeType === 'text/plain') return FileType.document;
  if (mimeType.includes('zip')) return FileType.archive;
  return FileType.document;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

export async function listMedia(req: Request, res: Response) {
  const { q, type } = req.query;

  const media = await prisma.mediaLibrary.findMany({
    where: {
      ...(q ? { filename: { contains: q as string, mode: 'insensitive' } } : {}),
      ...(type ? { fileType: type as FileType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // Never expose storage keys — replace with display-safe data
  const safeMedia = media.map(({ storageKey: _sk, ...rest }) => rest);
  return ok(res, safeMedia);
}

export async function uploadMedia(req: AuthRequest, res: Response) {
  if (!req.file) return badRequest(res, 'No file provided');

  if (!env.S3_BUCKET) {
    return badRequest(res, 'File storage not configured yet. Set S3_BUCKET in your environment.');
  }

  const fileId = uuidv4();
  const sanitized = sanitizeFilename(req.file.originalname);
  const storageKey = `media/${fileId}/${sanitized}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
  } catch (err) {
    console.error('S3 upload error:', err);
    return serverError(res, 'File upload failed');
  }

  const url = env.S3_ENDPOINT
    ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${storageKey}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${storageKey}`;

  const media = await prisma.mediaLibrary.create({
    data: {
      filename: req.file?.originalname || 'upload',
    
      storageKey: url,
    
      mimeType: req.file?.mimetype || 'application/octet-stream',
    
      fileType: FileType.image,
    
      sizeBytes: BigInt(req.file?.size || 0),
    
      uploadedBy: req.user!.id,
    },
  });

  const { storageKey: _sk, ...safeMedia } = media;
  return created(res, safeMedia);
}

export async function deleteMedia(req: AuthRequest, res: Response) {
  const media = await prisma.mediaLibrary.findUnique({ where: { id: req.params.id } });
  if (!media) return notFound(res);

  if (env.S3_BUCKET) {
    try {
      await s3.send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: media.storageKey })
      );
    } catch (err) {
      console.error('S3 delete error:', err);
      return serverError(res, 'Failed to delete file from storage');
    }
  }

  await prisma.mediaLibrary.delete({ where: { id: req.params.id } });
  return ok(res, { success: true });
}
