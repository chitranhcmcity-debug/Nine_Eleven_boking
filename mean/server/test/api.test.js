import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Booking, Customer, Product } from '../src/models.js';
import { seedAll } from '../src/seed.js';

let mongo;
let server;
let base;

const call = async (path, { method = 'GET', body, cookie } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
    body: body && JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
};

const futureDate = (daysAhead) => new Date(Date.now() + daysAhead * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10);

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('nineeleven_test'));
  await seedAll();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await mongo?.stop();
});

describe('booking', () => {
  it('books an available slot and rejects an overlapping one', async () => {
    const [service] = (await call('/services')).body;
    const [barber] = (await call('/barbers')).body;
    const slots = (await call(`/slots?date=${futureDate(2)}&service_id=${service.id}&barber_id=${barber.id}`)).body;
    assert.ok(slots.length > 0);
    assert.equal(slots[0].label, '10:00');

    const payload = { name: 'Nam', phone: '0909 119 911', serviceId: service.id, barberId: barber.id, startsAt: slots[0].value };
    const first = await call('/bookings', { method: 'POST', body: payload });
    assert.equal(first.status, 201);
    assert.match(first.body.code, /^NE-/);

    const saved = await Booking.findOne({ code: first.body.code });
    assert.equal(saved.total, service.price);
    assert.equal((await Customer.findById(saved.customer)).phone, '0909119911');

    const second = await call('/bookings', { method: 'POST', body: { ...payload, name: 'Other', phone: '0909119912' } });
    assert.equal(second.status, 422);

    const after = (await call(`/slots?date=${futureDate(2)}&service_id=${service.id}&barber_id=${barber.id}`)).body;
    assert.ok(!after.some((slot) => slot.value === slots[0].value));
  });

  it('prevents two simultaneous requests from taking the same slot', async () => {
    const [, service] = (await call('/services')).body;
    const barber = (await call('/barbers')).body[1];
    const [slot] = (await call(`/slots?date=${futureDate(3)}&service_id=${service.id}&barber_id=${barber.id}`)).body;
    const attempt = (n) =>
      call('/bookings', {
        method: 'POST',
        body: { name: `C${n}`, phone: `09091199${n}0`, serviceId: service.id, barberId: barber.id, startsAt: slot.value },
      });
    const results = await Promise.all([attempt(1), attempt(2), attempt(3)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 422, 422]);
  });

  it('validates input', async () => {
    const [service] = (await call('/services')).body;
    const [barber] = (await call('/barbers')).body;
    const bad = await call('/bookings', {
      method: 'POST',
      body: { name: 'X', phone: 'abc', serviceId: service.id, barberId: barber.id, startsAt: new Date(Date.now() + 1e8).toISOString() },
    });
    assert.equal(bad.status, 422);
    const past = await call(`/slots?date=2000-01-01&service_id=${service.id}&barber_id=${barber.id}`);
    assert.equal(past.status, 422);
  });
});

describe('admin CRM', () => {
  it('requires authentication, then serves data after login', async () => {
    assert.equal((await call('/admin/dashboard')).status, 401);
    assert.equal((await call('/admin/login', { method: 'POST', body: { email: 'admin@nineeleven.vn', password: 'wrong' } })).status, 401);

    const login = await call('/admin/login', { method: 'POST', body: { email: 'admin@nineeleven.vn', password: 'nineeleven' } });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];

    const dashboard = await call('/admin/dashboard', { cookie });
    assert.equal(dashboard.status, 200);
    assert.equal(typeof dashboard.body.pending, 'number');

    const bookings = await call('/admin/bookings?status=pending', { cookie });
    assert.ok(bookings.body.data.length >= 1);
    const target = bookings.body.data[0];
    const updated = await call(`/admin/bookings/${target.id}`, { method: 'PATCH', body: { status: 'completed' }, cookie });
    assert.equal(updated.body.status, 'completed');
    assert.ok((await Customer.findOne({ phone: target.customer.phone })).lastVisitAt);

    assert.equal((await call(`/admin/bookings/${target.id}`, { method: 'PATCH', body: { status: 'bogus' }, cookie })).status, 422);
    const customers = await call('/admin/customers', { cookie });
    assert.ok(customers.body.data.every((c) => typeof c.bookingsCount === 'number'));
  });
});

describe('shop', () => {
  it('lists, filters and shows products', async () => {
    const all = await call('/products?sort=price_asc');
    assert.equal(all.body.total, 8);
    assert.ok(all.body.data.length <= 12);
    const prices = all.body.data.map((p) => p.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

    const mid = await call('/products?minPrice=400000&maxPrice=600000');
    assert.ok(mid.body.data.length > 0);
    assert.ok(mid.body.data.every((p) => p.price >= 400000 && p.price < 600000));

    const kbp = await call('/products?category=grooming');
    assert.ok(kbp.body.data.length > 0 && kbp.body.data.every((p) => p.category === 'grooming'));
    const detail = await call(`/products/${kbp.body.data[0].slug}`);
    assert.equal(detail.body.product.id, kbp.body.data[0].id);
    assert.equal((await call('/products/does-not-exist')).status, 404);
  });

  it('places an order, decrements stock, applies shipping and is idempotent', async () => {
    const { data } = (await call('/products')).body;
    const [a, b] = data;
    const before = (await Product.findById(a.id)).stock;
    const body = {
      name: 'Nam',
      phone: '0909119911',
      address: '1 Nguyễn Trãi',
      checkoutToken: 'tok-1',
      items: [{ productId: a.id, quantity: 2 }, { productId: a.id, quantity: 1 }, { productId: b.id, quantity: 1 }],
    };
    const first = await call('/orders', { method: 'POST', body });
    assert.equal(first.status, 201);
    assert.equal((await Product.findById(a.id)).stock, before - 3);

    const again = await call('/orders', { method: 'POST', body });
    assert.equal(again.body.code, first.body.code);
    assert.equal((await Product.findById(a.id)).stock, before - 3);

    const order = (await call(`/orders/${first.body.code}`)).body;
    const subtotal = a.price * 3 + b.price;
    assert.equal(order.total, subtotal + (subtotal >= 1_000_000 ? 0 : 30_000));
  });

  it('rejects an order that exceeds stock without changing it', async () => {
    const [product] = (await call('/products')).body.data;
    const stock = (await Product.findById(product.id)).stock;
    await Product.updateOne({ _id: product.id }, { stock: 1 });
    const result = await call('/orders', {
      method: 'POST',
      body: { name: 'N', phone: '0909119911', address: 'x', items: [{ productId: product.id, quantity: 2 }] },
    });
    assert.equal(result.status, 422);
    assert.equal((await Product.findById(product.id)).stock, 1);
    await Product.updateOne({ _id: product.id }, { stock });
  });
});

describe('content', () => {
  it('serves the home payload, articles, branches and accepts inquiries', async () => {
    const home = (await call('/home')).body;
    assert.ok(home.newProducts.length > 0 && home.featuredProducts.length > 0);
    assert.equal(home.articles.length, 3);

    const articles = (await call('/articles')).body;
    assert.equal((await call(`/articles/${articles.data[0].slug}`)).status, 200);
    const branches = (await call('/branches')).body;
    assert.ok(branches.length >= 15);
    assert.equal((await call(`/branches/${branches[0].slug}`)).status, 200);
    assert.ok((await call('/branches?q=Chợ Lớn')).body.length >= 1);

    const inquiry = await call('/inquiries', {
      method: 'POST',
      body: { kind: 'academy', name: 'Nam', phone: '0909119911', message: 'Học phí?' },
    });
    assert.equal(inquiry.status, 201);
    assert.equal((await call('/inquiries', { method: 'POST', body: { name: 'x' } })).status, 422);
  });
});
