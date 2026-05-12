import { Router } from 'express';

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from './auth.controller';

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  login
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

export default router;