import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../../utils/email';

function safeUser(user: { id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null; role: string; emailVerified: boolean; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

export async function register(data: { firstName: string; lastName: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(data.password, 12);
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      refreshTokenHash,
    },
  });

  await sendWelcomeEmail(user.email, user.firstName);

  const { accessToken } = generateTokens(user);
  return { user: safeUser(user), accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

  const { accessToken } = generateTokens(user);
  return { user: safeUser(user), accessToken, refreshToken };
}

export async function refresh(rawToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new Error('INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refreshTokenHash) throw new Error('INVALID_TOKEN');

  const valid = await bcrypt.compare(rawToken, user.refreshTokenHash);
  if (!valid) {
    // Possible replay attack - invalidate all sessions
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
    throw new Error('INVALID_TOKEN');
  }

  const newRefreshToken = crypto.randomBytes(64).toString('hex');
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newRefreshTokenHash } });

  const { accessToken } = generateTokens(user);
  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: token, resetPasswordExpires: expires },
  });

  await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });
  if (!user) throw new Error('INVALID_TOKEN');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null, refreshTokenHash: null },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('NOT_FOUND');
  return safeUser(user);
}

export async function updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatarUrl?: string }) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return safeUser(user);
}
