import { Router } from 'express';
import mongoose from 'mongoose';
import { BOOKING_STATUSES, Booking, Customer } from '../models.js';
import { HttpError, badRequest, handler, pageParams, paginated } from '../http.js';
import { requireAuth } from './auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Start of the Vietnam-local day / month containing `now`, as UTC instants. */
function vnBoundaries(now = new Date()) {
  const local = new Date(now.getTime() + VN_OFFSET_MS);
  const dayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - VN_OFFSET_MS;
  const monthStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - VN_OFFSET_MS;
  const nextMonthStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - VN_OFFSET_MS;
  return {
    dayStart: new Date(dayStart),
    dayEnd: new Date(dayStart + 24 * 60 * 60 * 1000),
    monthStart: new Date(monthStart),
    nextMonthStart: new Date(nextMonthStart),
  };
}

const withRelations = (query) =>
  query.populate('customer', 'name phone email').populate('service', 'name').populate('barber', 'name');

adminRouter.get(
  '/dashboard',
  handler(async (_req, res) => {
    const { dayStart, dayEnd, monthStart, nextMonthStart } = vnBoundaries();
    const [today, pending, customers, revenue] = await Promise.all([
      withRelations(Booking.find({ startsAt: { $gte: dayStart, $lt: dayEnd } }).sort('startsAt')),
      Booking.countDocuments({ status: 'pending' }),
      Customer.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'completed', startsAt: { $gte: monthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, sum: { $sum: '$total' } } },
      ]),
    ]);
    res.json({ today, todayCount: today.length, pending, customers, revenue: revenue[0]?.sum ?? 0 });
  }),
);

adminRouter.get(
  '/bookings',
  handler(async (req, res) => {
    const filter = BOOKING_STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
    const paging = pageParams(req.query, 20);
    const [data, total] = await Promise.all([
      withRelations(Booking.find(filter).sort('-startsAt').skip(paging.skip).limit(paging.perPage)),
      Booking.countDocuments(filter),
    ]);
    res.json(paginated(data, total, paging));
  }),
);

adminRouter.patch(
  '/bookings/:id',
  handler(async (req, res) => {
    const { status } = req.body;
    if (!BOOKING_STATUSES.includes(status)) {
      throw badRequest('Trạng thái không hợp lệ.');
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new HttpError(404, 'Không tìm thấy lịch hẹn.');
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) {
      throw new HttpError(404, 'Không tìm thấy lịch hẹn.');
    }
    if (status === 'completed') {
      await Customer.updateOne({ _id: booking.customer }, { lastVisitAt: new Date() });
    }
    res.json(await withRelations(Booking.findById(booking.id)));
  }),
);

adminRouter.get(
  '/customers',
  handler(async (req, res) => {
    const paging = pageParams(req.query, 20);
    const [customers, total] = await Promise.all([
      Customer.find().sort('-createdAt').skip(paging.skip).limit(paging.perPage),
      Customer.countDocuments(),
    ]);
    const counts = await Booking.aggregate([
      { $match: { customer: { $in: customers.map((c) => c._id) } } },
      { $group: { _id: '$customer', count: { $sum: 1 } } },
    ]);
    const byCustomer = new Map(counts.map((c) => [String(c._id), c.count]));
    const data = customers.map((c) => ({ ...c.toJSON(), bookingsCount: byCustomer.get(c.id) ?? 0 }));
    res.json(paginated(data, total, paging));
  }),
);
