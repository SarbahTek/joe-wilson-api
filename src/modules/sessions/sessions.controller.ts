import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { prisma } from '../../config/database';
import { ok, notFound, badRequest } from '../../utils/response';

export async function getSession(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      resources: { include: { media: true }, orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!session) return notFound(res);

  // Get prev/next sessions for navigation
  const siblings = await prisma.session.findMany({
    where: { masterclassId: session.masterclassId },
    orderBy: { orderIndex: 'asc' },
    select: { id: true, orderIndex: true, title: true },
  });

  const currentIdx = siblings.findIndex((s) => s.id === id);
  const prevSession = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const nextSession = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

  // Get user progress
  const progress = await prisma.sessionProgress.findUnique({
    where: { userId_sessionId: { userId, sessionId: id } },
  });

  // NOTE: When Mux is configured, generate signed playback token here
  // const muxToken = session.muxPlaybackId ? await generateMuxToken(session.muxPlaybackId, userId) : null;

  return ok(res, {
    ...session,
    progress,
    prevSession,
    nextSession,
    muxSignedToken: null, // Replace with muxToken when Mux is configured
  });
}

export async function updateProgress(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const sessionId = req.params.id;
  const { lastWatchedSeconds, completed } = req.body;

  if (typeof lastWatchedSeconds !== 'number' || lastWatchedSeconds < 0) {
    return badRequest(res, 'lastWatchedSeconds must be a non-negative number');
  }

  const progress = await prisma.sessionProgress.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: {
      userId,
      sessionId,
      lastWatchedSeconds,
      completedAt: completed ? new Date() : null,
    },
    update: {
      lastWatchedSeconds,
      ...(completed && { completedAt: new Date() }),
    },
  });

  return ok(res, progress);
}
