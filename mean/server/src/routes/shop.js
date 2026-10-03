import { Router } from 'express';
import mongoose from 'mongoose';
import { Order, Product } from '../models.js';
import {
  HttpError,
  badRequest,
  escapeRegex,
  handler,
  optionalEmail,
  pageParams,
  paginated,
  randomCode,
  requirePhone,
  requireText,
  text,
} from '../http.js';

export const shopRouter = Router();

const SHIPPING_FEE = 30_000;
const FREE_SHIPPING_FROM = 1_000_000;
const MAX_QUANTITY = 20;

const SORTS = {
  newest: '-createdAt',
  price_asc: 'price',
  price_desc: '-price',
  featured: '-featured -createdAt',
};

shopRouter.get(
  '/products',
  handler(async (req, res) => {
    const filter = {};
    const q = text(req.query.q, 100);
    if (q) {
      filter.name = new RegExp(escapeRegex(q), 'i');
    }
    if (text(req.query.category)) {
      filter.category = text(req.query.category);
    }
    if (text(req.query.brand)) {
      filter.brand = text(req.query.brand);
    }
    const price = {};
    const minPrice = Number.parseInt(req.query.minPrice, 10);
    const maxPrice = Number.parseInt(req.query.maxPrice, 10);
    if (Number.isFinite(minPrice) && minPrice > 0) {
      price.$gte = minPrice;
    }
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      price.$lt = maxPrice;
    }
    if (Object.keys(price).length > 0) {
      filter.price = price;
    }
    const paging = pageParams(req.query, 12);
    const [data, total, brands] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[req.query.sort] ?? SORTS.newest)
        .skip(paging.skip)
        .limit(paging.perPage),
      Product.countDocuments(filter),
      Product.distinct('brand'),
    ]);
    res.json({ ...paginated(data, total, paging), brands: brands.filter(Boolean).sort() });
  }),
);

shopRouter.get(
  '/products/:slug',
  handler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      throw new HttpError(404, 'Không tìm thấy sản phẩm.');
    }
    const related = await Product.find({ category: product.category, _id: { $ne: product.id } }).limit(4);
    res.json({ product, related });
  }),
);

/** Combine duplicate lines and validate each requested quantity. */
function normaliseItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw badRequest('Giỏ hàng đang trống.');
  }
  const quantities = new Map();
  for (const raw of rawItems) {
    if (!mongoose.isValidObjectId(raw?.productId)) {
      throw badRequest('Sản phẩm không hợp lệ.');
    }
    const quantity = Number.parseInt(raw.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw badRequest('Số lượng không hợp lệ.');
    }
    const key = String(raw.productId);
    quantities.set(key, Math.min(MAX_QUANTITY, (quantities.get(key) ?? 0) + quantity));
  }
  return quantities;
}

async function reserveStock(quantities) {
  const reserved = [];
  try {
    const items = [];
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!product) {
        const existing = await Product.findById(productId).select('name');
        throw badRequest(`${existing?.name ?? 'Sản phẩm'} không đủ hàng.`);
      }
      reserved.push([productId, quantity]);
      items.push({ product: product.id, name: product.name, price: product.price, quantity });
    }
    return items;
  } catch (error) {
    await Promise.all(reserved.map(([id, quantity]) => Product.updateOne({ _id: id }, { $inc: { stock: quantity } })));
    throw error;
  }
}

shopRouter.post(
  '/orders',
  handler(async (req, res) => {
    const body = req.body;
    const checkoutToken = text(body.checkoutToken, 64) || undefined;
    if (checkoutToken) {
      const existing = await Order.findOne({ checkoutToken });
      if (existing) {
        return res.status(200).json({ code: existing.code });
      }
    }
    const customer = {
      name: requireText(body.name, 'Họ tên', 100),
      phone: requirePhone(body.phone),
      email: optionalEmail(body.email),
      address: requireText(body.address, 'Địa chỉ', 500),
      notes: text(body.notes, 500) || undefined,
    };
    const quantities = normaliseItems(body.items);
    const items = await reserveStock(quantities);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    try {
      const order = await Order.create({
        ...customer,
        checkoutToken,
        code: randomCode('ORD', 8),
        items,
        subtotal,
        shipping,
        total: subtotal + shipping,
      });
      res.status(201).json({ code: order.code });
    } catch (error) {
      await Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
      if (error?.code === 11000 && checkoutToken) {
        const existing = await Order.findOne({ checkoutToken });
        if (existing) {
          return res.status(200).json({ code: existing.code });
        }
      }
      throw error;
    }
  }),
);

shopRouter.get(
  '/orders/:code',
  handler(async (req, res) => {
    const order = await Order.findOne({ code: req.params.code });
    if (!order) {
      throw new HttpError(404, 'Không tìm thấy đơn hàng.');
    }
    res.json({
      code: order.code,
      name: order.name,
      address: order.address,
      items: order.items,
      shipping: order.shipping,
      total: order.total,
    });
  }),
);
