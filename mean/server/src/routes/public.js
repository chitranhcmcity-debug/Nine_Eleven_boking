import { Router } from 'express';
import { Article, Barber, Branch, Inquiry, Product, Service } from '../models.js';
import {
  escapeRegex,
  handler,
  optionalEmail,
  pageParams,
  paginated,
  requirePhone,
  requireText,
  HttpError,
} from '../http.js';

export const publicRouter = Router();

publicRouter.get(
  '/home',
  handler(async (_req, res) => {
    const [services, barbers, newProducts, featuredProducts, articles, branches] = await Promise.all([
      Service.find({ active: true }).sort('createdAt'),
      Barber.find({ active: true }).sort('createdAt'),
      Product.find({ newArrival: true }).sort('-createdAt').limit(8),
      Product.find({ featured: true }).sort('-createdAt').limit(8),
      Article.find().sort('-createdAt').limit(3),
      Branch.find().sort('createdAt').limit(6),
    ]);
    res.json({ services, barbers, newProducts, featuredProducts, articles, branches });
  }),
);

publicRouter.get(
  '/services',
  handler(async (_req, res) => res.json(await Service.find({ active: true }).sort('createdAt'))),
);

publicRouter.get(
  '/barbers',
  handler(async (_req, res) => res.json(await Barber.find({ active: true }).sort('createdAt'))),
);

publicRouter.get(
  '/articles',
  handler(async (req, res) => {
    const paging = pageParams(req.query, 9);
    const [data, total] = await Promise.all([
      Article.find().sort('-createdAt').skip(paging.skip).limit(paging.perPage),
      Article.countDocuments(),
    ]);
    res.json(paginated(data, total, paging));
  }),
);

publicRouter.get(
  '/articles/:slug',
  handler(async (req, res) => {
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) {
      throw new HttpError(404, 'Không tìm thấy bài viết.');
    }
    res.json(article);
  }),
);

publicRouter.get(
  '/branches',
  handler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filter = q
      ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { address: new RegExp(escapeRegex(q), 'i') }] }
      : {};
    res.json(await Branch.find(filter).sort('createdAt'));
  }),
);

publicRouter.get(
  '/branches/:slug',
  handler(async (req, res) => {
    const branch = await Branch.findOne({ slug: req.params.slug });
    if (!branch) {
      throw new HttpError(404, 'Không tìm thấy chi nhánh.');
    }
    res.json(branch);
  }),
);

publicRouter.post(
  '/inquiries',
  handler(async (req, res) => {
    const kind = req.body.kind === 'academy' ? 'academy' : 'consultation';
    await Inquiry.create({
      kind,
      name: requireText(req.body.name, 'Họ tên', 100),
      phone: requirePhone(req.body.phone),
      email: optionalEmail(req.body.email),
      message: requireText(req.body.message, 'Nội dung', 2000),
    });
    res.status(201).json({ message: 'Đã gửi yêu cầu. Chúng tôi sẽ liên hệ sớm.' });
  }),
);
