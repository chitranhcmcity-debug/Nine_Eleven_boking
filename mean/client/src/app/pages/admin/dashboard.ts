import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { AdminBooking, Dashboard } from '../../core/models';
import { BookingTable } from './booking-table';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, BookingTable, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as d) {
      @if (message()) { <div class="notice">{{ message() }}</div> }
      <div class="stats">
        <article><span>Lịch hôm nay</span><strong>{{ d.todayCount }}</strong><small>lượt khách</small></article>
        <article><span>Chờ xác nhận</span><strong>{{ d.pending }}</strong><small>lịch hẹn</small></article>
        <article><span>Tổng khách hàng</span><strong>{{ d.customers }}</strong><small>trong CRM</small></article>
        <article><span>Doanh thu tháng</span><strong>{{ d.revenue / 1000000 | number: '1.1-1' }}M</strong><small>VNĐ hoàn thành</small></article>
      </div>
      <section class="panel">
        <div class="panel-head">
          <div><small>LỊCH TRÌNH</small><h2>Ghế hôm nay</h2></div>
          <a routerLink="/admin/lich-hen">Xem tất cả →</a>
        </div>
        <app-booking-table [bookings]="d.today" (statusChange)="update($event.booking, $event.status)" />
      </section>
    }
  `,
})
export class AdminDashboard {
  private readonly api = inject(Api);
  protected readonly data = signal<Dashboard | null>(null);
  protected readonly message = signal('');

  constructor() {
    this.load();
  }

  private load(): void {
    this.api.adminDashboard().subscribe((data) => this.data.set(data));
  }

  protected update(booking: AdminBooking, status: string): void {
    this.api.updateBookingStatus(booking.id, status).subscribe(() => {
      this.message.set(`Đã cập nhật lịch hẹn ${booking.code}`);
      this.load();
    });
  }
}
