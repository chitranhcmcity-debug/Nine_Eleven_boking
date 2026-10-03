import { Routes } from '@angular/router';
import { adminGuard } from './core/auth';

export const routes: Routes = [
  {
    path: 'admin/login',
    title: 'Đăng nhập CRM',
    loadComponent: () => import('./pages/admin/login').then((m) => m.AdminLogin),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: 'Tổng quan · NineEleven CRM',
        data: { heading: 'Tổng quan hôm nay' },
        loadComponent: () => import('./pages/admin/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'lich-hen',
        title: 'Lịch hẹn · NineEleven CRM',
        data: { heading: 'Quản lý lịch hẹn' },
        loadComponent: () => import('./pages/admin/bookings').then((m) => m.AdminBookings),
      },
      {
        path: 'khach-hang',
        title: 'Khách hàng · NineEleven CRM',
        data: { heading: 'Danh sách khách hàng' },
        loadComponent: () => import('./pages/admin/customers').then((m) => m.AdminCustomers),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layouts/storefront-layout').then((m) => m.StorefrontLayout),
    children: [
      {
        path: '',
        title: 'NineEleven Barber Studio | Cắt tóc nam & Grooming',
        loadComponent: () => import('./pages/home').then((m) => m.Home),
      },
      {
        path: 'dat-lich',
        title: 'Đặt lịch — NineEleven',
        loadComponent: () => import('./pages/booking').then((m) => m.Booking),
      },
      {
        path: 'dat-lich/thanh-cong/:code',
        title: 'Đặt lịch thành công — NineEleven',
        loadComponent: () => import('./pages/booking-success').then((m) => m.BookingSuccess),
      },
      {
        path: 'mua-sam',
        title: 'Mua sắm — NineEleven',
        loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop),
      },
      {
        path: 'mua-sam/:slug',
        title: 'Sản phẩm — NineEleven',
        loadComponent: () => import('./pages/shop/product').then((m) => m.ProductPage),
      },
      {
        path: 'gio-hang',
        title: 'Giỏ hàng & thanh toán — NineEleven',
        loadComponent: () => import('./pages/shop/cart').then((m) => m.CartPage),
      },
      {
        path: 'don-hang/:code',
        title: 'Đặt hàng thành công — NineEleven',
        loadComponent: () => import('./pages/shop/order-success').then((m) => m.OrderSuccess),
      },
      {
        path: 'tin-tuc',
        title: 'Tin tức underground — NineEleven',
        loadComponent: () => import('./pages/content/articles').then((m) => m.Articles),
      },
      {
        path: 'tin-tuc/:slug',
        title: 'Tin tức — NineEleven',
        loadComponent: () => import('./pages/content/article').then((m) => m.ArticlePage),
      },
      {
        path: 'chi-nhanh',
        title: 'Chi nhánh — NineEleven',
        loadComponent: () => import('./pages/content/branches').then((m) => m.Branches),
      },
      {
        path: 'chi-nhanh/:slug',
        title: 'Chi nhánh — NineEleven',
        loadComponent: () => import('./pages/content/branch').then((m) => m.BranchPage),
      },
      {
        path: 'hoc-barber',
        title: 'Học barber — NineEleven',
        loadComponent: () => import('./pages/content/academy').then((m) => m.Academy),
      },
      {
        path: 'tu-van',
        title: 'Hỏi barber — NineEleven',
        data: { kind: 'consultation' },
        loadComponent: () => import('./pages/content/inquiry').then((m) => m.Inquiry),
      },
      {
        path: 'chinh-sach/:slug',
        title: 'Chính sách — NineEleven',
        loadComponent: () => import('./pages/content/policy').then((m) => m.Policy),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
