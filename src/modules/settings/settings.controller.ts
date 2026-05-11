import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok } from '../../utils/response';

const PUBLIC_KEYS = [
  'contact_email', 'contact_phone_1', 'contact_phone_2',
  'contact_address_1', 'contact_address_2',
  'social_facebook', 'social_twitter', 'social_youtube',
  'social_spotify', 'social_apple_music', 'social_soundcloud',
];

function settingsArrayToObject(settings: { key: string; value: string }[]) {
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
}

export async function getPublicSettings(req: Request, res: Response) {
  const settings = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  return ok(res, settingsArrayToObject(settings));
}

export async function getAllSettings(req: Request, res: Response) {
  const settings = await prisma.setting.findMany();
  return ok(res, settingsArrayToObject(settings));
}

export async function updateSettings(req: Request, res: Response) {
  const updates = req.body as Record<string, string>;

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  const settings = await prisma.setting.findMany();
  return ok(res, settingsArrayToObject(settings));
}
