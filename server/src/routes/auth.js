import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models.js';
import { HttpError, handler, text } from '../http.js';

export const authRouter = Router();

const COOKIE = 'ne_token';
const SESSION_MS = 12 * 60 * 60 * 1000;
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

const secret = () => process.env.JWT_SECRET || 'dev-only-secret-change-me';

function cookieOptions(maxAge) {
  return { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge };
}

export const requireAuth = handler(async (req, _res, next) => {
  let payload;
  try {
    payload = jwt.verify(req.cookies?.[COOKIE] ?? '', secret());
  } catch {
    throw new HttpError(401, 'Bạn cần đăng nhập.');
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'Bạn cần đăng nhập.');
  }
  req.user = user;
  next();
});

authRouter.post(
  '/login',
  handler(async (req, res) => {
    const email = text(req.body.email, 200).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = email && password ? await User.findOne({ email }) : null;
    const valid = user ? await bcrypt.compare(password, user.password) : false;
    if (!valid) {
      throw new HttpError(401, 'Thông tin đăng nhập không đúng.');
    }
    const remember = req.body.remember === true;
    const maxAge = remember ? REMEMBER_MS : SESSION_MS;
    const token = jwt.sign({ sub: user.id }, secret(), { expiresIn: Math.floor(maxAge / 1000) });
    res.cookie(COOKIE, token, cookieOptions(remember ? maxAge : undefined));
    res.json({ user: { name: user.name, email: user.email } });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, cookieOptions());
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: { name: req.user.name, email: req.user.email } });
});
