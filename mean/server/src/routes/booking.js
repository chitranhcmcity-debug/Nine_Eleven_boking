import { Router } from 'express';
import mongoose from 'mongoose';
import { Barber, Booking, Customer, INACTIVE_STATUSES, Service } from '../models.js';
import {
  HttpError,
  badRequest,
  handler,
  optionalEmail,
  randomCode,
  requirePhone,
  requireText,
  text,
} from '../http.js';

export const bookingRouter = Router();

const MINUTE = 60_000;
const OPEN_HOUR = 10;
const CLOSE_HOUR = 20;
const SLOT_MINUTES = 30;
const VN_OFFSET = '+07:00';

const pad = (n) => String(n).padStart(2, '0');
const vnToday = () => new Date(Date.now() + 7 * 60 * MINUTE).toISOString().slice(0, 10);

function requireId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw badRequest(`${label} không hợp lệ.`);
  }
  return value;
}

async function overlapsExisting(barberId, start, end) {
  return Booking.exists({
    barber: barberId,
    status: { $nin: INACTIVE_STATUSES },
    startsAt: { $lt: end },
    endsAt: { $gt: start },
  });
}

/** Serialise bookings per barber so the overlap check and insert cannot interleave in this process. */
const locks = new Map();
async function withBarberLock(barberId, task) {
  const key = String(barberId);
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => {});
  locks.set(key, tail);
  tail.then(() => locks.get(key) === tail && locks.delete(key));
  return run;
}

bookingRouter.get(
  '/slots',
  handler(async (req, res) => {
    const date = text(req.query.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00${VN_OFFSET}`))) {
      throw badRequest('Ngày không hợp lệ.');
    }
    if (date < vnToday()) {
      throw badRequest('Ngày phải từ hôm nay trở đi.');
    }
    const service = await Service.findById(requireId(req.query.service_id, 'Dịch vụ'));
    const barberId = requireId(req.query.barber_id, 'Barber');
    if (!service || !(await Barber.exists({ _id: barberId }))) {
      throw badRequest('Dịch vụ hoặc barber không tồn tại.');
    }

    const dayStart = new Date(`${date}T00:00:00${VN_OFFSET}`);
    const closeAt = dayStart.getTime() + CLOSE_HOUR * 60 * MINUTE;
    const booked = await Booking.find({
      barber: barberId,
      status: { $nin: INACTIVE_STATUSES },
      startsAt: { $lt: new Date(closeAt) },
      endsAt: { $gt: dayStart },
    }).select('startsAt endsAt');

    const slots = [];
    const now = Date.now();
    for (let minutes = OPEN_HOUR * 60; minutes < CLOSE_HOUR * 60; minutes += SLOT_MINUTES) {
      const start = dayStart.getTime() + minutes * MINUTE;
      const end = start + service.duration * MINUTE;
      if (end > closeAt || start <= now) {
        continue;
      }
      const busy = booked.some((b) => b.startsAt.getTime() < end && b.endsAt.getTime() > start);
      if (!busy) {
        slots.push({ value: new Date(start).toISOString(), label: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}` });
      }
    }
    res.json(slots);
  }),
);

bookingRouter.post(
  '/bookings',
  handler(async (req, res) => {
    const body = req.body;
    const name = requireText(body.name, 'Họ tên', 100);
    const phone = requirePhone(body.phone);
    const email = optionalEmail(body.email);
    const notes = text(body.notes, 500) || undefined;
    const start = new Date(body.startsAt);
    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      throw badRequest('Thời gian đặt lịch không hợp lệ.');
    }
    const [service, barber] = await Promise.all([
      Service.findOne({ _id: requireId(body.serviceId, 'Dịch vụ'), active: true }),
      Barber.findOne({ _id: requireId(body.barberId, 'Barber'), active: true }),
    ]);
    if (!service || !barber) {
      throw badRequest('Dịch vụ hoặc barber không tồn tại.');
    }
    const end = new Date(start.getTime() + service.duration * MINUTE);

    const booking = await withBarberLock(barber.id, async () => {
      if (await overlapsExisting(barber.id, start, end)) {
        throw new HttpError(422, 'Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.');
      }
      const customer = await Customer.findOneAndUpdate(
        { phone },
        { $set: { name, ...(email && { email }) } },
        { upsert: true, new: true },
      );
      return Booking.create({
        code: randomCode('NE'),
        customer: customer.id,
        service: service.id,
        barber: barber.id,
        startsAt: start,
        endsAt: end,
        notes,
        total: service.price,
      });
    });
    res.status(201).json({ code: booking.code, startsAt: booking.startsAt });
  }),
);

bookingRouter.get(
  '/bookings/:code',
  handler(async (req, res) => {
    const booking = await Booking.findOne({ code: req.params.code }).select('code startsAt');
    if (!booking) {
      throw new HttpError(404, 'Không tìm thấy lịch hẹn.');
    }
    res.json({ code: booking.code, startsAt: booking.startsAt });
  }),
);
