export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export interface Barber {
  id: string;
  name: string;
  title?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  description?: string;
  newArrival?: boolean;
  badge?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category?: string;
  image: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city?: string;
  description: string;
  image: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

export interface Slot {
  value: string;
  label: string;
}

export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'serving', label: 'Đang phục vụ' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'no_show', label: 'Không đến' },
] as const;

export interface AdminBooking {
  id: string;
  code: string;
  startsAt: string;
  total: number;
  status: string;
  customer: { name: string; phone: string };
  service: { name: string };
  barber: { name: string };
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisitAt?: string;
  bookingsCount: number;
}

export interface Dashboard {
  today: AdminBooking[];
  todayCount: number;
  pending: number;
  customers: number;
  revenue: number;
}

export interface OrderSummary {
  code: string;
  name: string;
  address: string;
  items: { name: string; price: number; quantity: number }[];
  shipping: number;
  total: number;
}

export interface BookingRequest {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  serviceId: string;
  barberId: string;
  startsAt: string;
}

export interface OrderRequest {
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  checkoutToken: string;
  items: { productId: string; quantity: number }[];
}

export interface HomeData {
  services: Service[];
  barbers: Barber[];
  newProducts: Product[];
  featuredProducts: Product[];
  articles: Article[];
  branches: Branch[];
}
