import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const jsonOptions = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    delete ret.password;
    return ret;
  },
};

function define(name, definition, extra = (schema) => schema) {
  const schema = extra(new Schema(definition, { timestamps: true, toJSON: jsonOptions }));
  return model(name, schema);
}

export const BOOKING_STATUSES = ['pending', 'confirmed', 'serving', 'completed', 'cancelled', 'no_show'];
export const INACTIVE_STATUSES = ['cancelled', 'no_show'];

export const User = define('User', {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
});

export const Service = define('Service', {
  name: { type: String, required: true, unique: true },
  description: String,
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  active: { type: Boolean, default: true },
});

export const Barber = define('Barber', {
  name: { type: String, required: true, unique: true },
  title: String,
  bio: String,
  avatar: String,
  active: { type: Boolean, default: true },
});

export const Customer = define('Customer', {
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  notes: String,
  lastVisitAt: Date,
});

export const Booking = define(
  'Booking',
  {
    code: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    barber: { type: Schema.Types.ObjectId, ref: 'Barber', required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    notes: String,
    total: { type: Number, required: true },
  },
  (schema) => schema.index({ barber: 1, startsAt: 1, endsAt: 1 }),
);

export const Product = define('Product', {
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: String,
  category: { type: String, index: true },
  brand: { type: String, index: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  description: String,
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  badge: String,
});

export const Article = define('Article', {
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  body: String,
  image: String,
});

export const Branch = define('Branch', {
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  address: String,
  city: String,
  description: String,
  image: String,
});

export const Order = define('Order', {
  code: { type: String, required: true, unique: true },
  checkoutToken: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: { type: String, required: true },
  notes: String,
  subtotal: Number,
  shipping: Number,
  total: Number,
  status: { type: String, default: 'pending' },
  items: [
    {
      _id: false,
      product: { type: Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
});

export const Inquiry = define('Inquiry', {
  kind: { type: String, enum: ['academy', 'consultation'], default: 'consultation' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  message: { type: String, required: true },
});
