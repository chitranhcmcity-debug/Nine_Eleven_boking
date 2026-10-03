export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(422, message);

/** Wrap an async route handler so rejections reach the Express error handler. */
export const handler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const text = (value, max = 255) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function requireText(value, label, max = 255) {
  const result = text(value, max);
  if (!result) {
    throw badRequest(`${label} là bắt buộc.`);
  }
  return result;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[0-9+ ]{9,15}$/;

export function optionalEmail(value) {
  const result = text(value);
  if (result && !EMAIL_PATTERN.test(result)) {
    throw badRequest('Email không hợp lệ.');
  }
  return result || undefined;
}

export function requirePhone(value) {
  const result = text(value, 20);
  if (!PHONE_PATTERN.test(result)) {
    throw badRequest('Số điện thoại không hợp lệ.');
  }
  return result.replace(/\s+/g, '');
}

export function pageParams(query, perPage) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  return { page, perPage, skip: (page - 1) * perPage };
}

export const paginated = (data, total, { page, perPage }) => ({
  data,
  total,
  page,
  lastPage: Math.max(1, Math.ceil(total / perPage)),
});

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function randomCode(prefix, length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${code}`;
}
