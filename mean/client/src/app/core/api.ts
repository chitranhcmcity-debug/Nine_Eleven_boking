import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AdminBooking,
  AdminCustomer,
  Article,
  Barber,
  Branch,
  BookingRequest,
  Dashboard,
  HomeData,
  OrderRequest,
  OrderSummary,
  Paginated,
  Product,
  Service,
  Slot,
} from './models';

export type Query = Record<string, string | number | undefined | null>;

function params(query: Query = {}): HttpParams {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      result = result.set(key, String(value));
    }
  }
  return result;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  home() {
    return this.http.get<HomeData>('/api/home');
  }

  services() {
    return this.http.get<Service[]>('/api/services');
  }

  barbers() {
    return this.http.get<Barber[]>('/api/barbers');
  }

  slots(date: string, serviceId: string, barberId: string) {
    return this.http.get<Slot[]>('/api/slots', {
      params: params({ date, service_id: serviceId, barber_id: barberId }),
    });
  }

  createBooking(request: BookingRequest) {
    return this.http.post<{ code: string; startsAt: string }>('/api/bookings', request);
  }

  booking(code: string) {
    return this.http.get<{ code: string; startsAt: string }>(`/api/bookings/${code}`);
  }

  products(query: Query) {
    return this.http.get<Paginated<Product> & { brands: string[] }>('/api/products', { params: params(query) });
  }

  product(slug: string) {
    return this.http.get<{ product: Product; related: Product[] }>(`/api/products/${slug}`);
  }

  createOrder(request: OrderRequest) {
    return this.http.post<{ code: string }>('/api/orders', request);
  }

  order(code: string) {
    return this.http.get<OrderSummary>(`/api/orders/${code}`);
  }

  articles(page: number) {
    return this.http.get<Paginated<Article>>('/api/articles', { params: params({ page }) });
  }

  article(slug: string) {
    return this.http.get<Article>(`/api/articles/${slug}`);
  }

  branches(q?: string) {
    return this.http.get<Branch[]>('/api/branches', { params: params({ q }) });
  }

  branch(slug: string) {
    return this.http.get<Branch>(`/api/branches/${slug}`);
  }

  createInquiry(body: { kind: string; name: string; phone: string; email?: string; message: string }) {
    return this.http.post<{ message: string }>('/api/inquiries', body);
  }

  adminDashboard() {
    return this.http.get<Dashboard>('/api/admin/dashboard');
  }

  adminBookings(query: Query) {
    return this.http.get<Paginated<AdminBooking>>('/api/admin/bookings', { params: params(query) });
  }

  updateBookingStatus(id: string, status: string) {
    return this.http.patch<AdminBooking>(`/api/admin/bookings/${id}`, { status });
  }

  adminCustomers(page: number) {
    return this.http.get<Paginated<AdminCustomer>>('/api/admin/customers', { params: params({ page }) });
  }
}
