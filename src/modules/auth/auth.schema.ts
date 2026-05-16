import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           minLength: 8
 *           example: password123
 */
export const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           example: password123
 */
export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     RefreshTokenInput:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: some-refresh-token
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ForgotPasswordInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ResetPasswordInput:
 *       type: object
 *       required:
 *         - token
 *         - password
 *       properties:
 *         token:
 *           type: string
 *           example: reset-token
 *         password:
 *           type: string
 *           minLength: 8
 *           example: newpassword123
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateProfileInput:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           example: Doe
 *         avatarUrl:
 *           type: string
 *           format: uri
 *           example: https://example.com/avatar.jpg
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});