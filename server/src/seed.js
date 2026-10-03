import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Article, Barber, Branch, Product, Service, User } from './models.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readData = (name) => JSON.parse(fs.readFileSync(path.join(here, `../data/${name}.json`), 'utf8'));
const storefront = () => readData('storefront');

/** The branch and article source data still carries the old brand name. */
const rebrand = (value) => value.replace(/4RAU/gi, () => 'NineEleven').replace(/Barber Cutclub/gi, 'Barber Studio');
const DEFAULT_STOCK = 20;

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const services = [
  ['Cắt & tạo kiểu', 'Tư vấn form mặt, cắt tạo kiểu và hoàn thiện với sản phẩm.', 45, 180000],
  ['Combo NineEleven', 'Cắt tóc, gội thư giãn, massage và tạo kiểu.', 60, 280000],
  ['Uốn texture', 'Tạo độ phồng và texture tự nhiên, dễ chăm sóc.', 120, 650000],
  ['Nhuộm thời trang', 'Màu nhuộm cá nhân hoá theo phong cách của bạn.', 150, 850000],
];

const barbers = [
  ['Khoa Nguyễn', 'Creative Director'],
  ['Minh Trần', 'Senior Barber'],
  ['Đạt Lê', 'Fade Specialist'],
];

function toBranch(raw) {
  const [, ...rest] = rebrand(raw.name).split(' – ');
  const [name, ...areas] = rest.join(' – ').split(/\s*[|–]\s*/);
  const area = areas.join(' — ').replace(/Cắt Tóc Nam\s*/i, '').trim();
  const title = area ? `${name} – ${area}` : name;
  return {
    name: title,
    slug: slugify(title),
    address: area || name,
    city: 'TP. Hồ Chí Minh',
    description: 'Không gian barber dành riêng cho bạn. Mở cửa 10:00 — 20:00 mỗi ngày.',
    image: raw.image,
  };
}

function toArticle(raw, index) {
  return {
    title: rebrand(raw.title),
    slug: slugify(rebrand(raw.title)),
    excerpt: raw.excerpt ?? 'Cảm hứng tóc, grooming và lifestyle từ barber NineEleven.',
    body: raw.bodyFile ? fs.readFileSync(path.join(here, `../data/${raw.bodyFile}`), 'utf8') : 'Nội dung bài viết đang được cập nhật.',
    category: raw.category ?? 'Kiểu tóc',
    image: raw.image,
    createdAt: new Date(Date.now() - index * 3 * 24 * 60 * 60 * 1000),
  };
}

async function upsertAll(model, key, docs) {
  await model.bulkWrite(
    docs.map((doc) => ({ updateOne: { filter: { [key]: doc[key] }, update: { $set: doc }, upsert: true } })),
  );
}

/** Idempotent: safe to run repeatedly. */
export async function seedAll() {
  const data = storefront();
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'nineeleven', 10);
  await User.updateOne(
    { email: 'admin@nineeleven.vn' },
    { $set: { name: 'NineEleven Admin', password } },
    { upsert: true },
  );
  await upsertAll(
    Service,
    'name',
    services.map(([name, description, duration, price]) => ({ name, description, duration, price })),
  );
  await upsertAll(Barber, 'name', barbers.map(([name, title]) => ({ name, title })));
  const products = readData('products').map((product) => ({ brand: 'NINEELEVEN', ...product }));
  // Stock is only set for new products, so re-seeding never resets what has already been sold.
  await Product.bulkWrite(
    products.map((product) => ({
      updateOne: { filter: { slug: product.slug }, update: { $set: product, $setOnInsert: { stock: DEFAULT_STOCK } }, upsert: true },
    })),
  );
  // The catalogue is defined by products.json, so drop products that are no longer in it.
  await Product.deleteMany({ slug: { $nin: products.map((product) => product.slug) } });
  const branches = data.branches.map(toBranch);
  await upsertAll(Branch, 'slug', branches);
  await Branch.deleteMany({ slug: { $nin: branches.map((branch) => branch.slug) } });
  await upsertAll(Article, 'slug', data.blogs.map(toArticle));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nineeleven';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await seedAll();
  console.log('Đã seed dữ liệu. Admin: admin@nineeleven.vn / nineeleven');
  await mongoose.disconnect();
}
