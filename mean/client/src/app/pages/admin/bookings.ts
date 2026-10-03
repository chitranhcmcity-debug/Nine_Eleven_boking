import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { Api } from '../../core/api';
import { AdminBooking } from '../../core/models';
import { BookingTable } from './booking-table';

const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'serving', label: 'Đang phục vụ' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

@Component({
  selector: 'app-admin-bookings',
  imports: [RouterLink, BookingTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) { <div class="notice">{{ message() }}</div> }
    <div class="filters">
      @for (f of filters; track f.key) {
        <a [class.active]="status() === f.key" routerLink="." [queryParams]="{ status: f.key || null }">{{ f.label }}</a>
      }
    </div>
    @if (result(); as r) {
      <section class="panel">
        <app-booking-table [bookings]="r.data" (statusChange)="update($event.booking, $event.status)" />
      </section>
      @if (r.lastPage > 1) {
        <nav class="filters" aria-label="Phân trang">
          @if (r.page > 1) { <a routerLink="." [queryParams]="{ status: status() || null, page: r.page - 1 }" queryParamsHandling="merge">← Trang trước</a> }
          <span>Trang {{ r.page }} / {{ r.lastPage }}</span>
          @if (r.page < r.lastPage) { <a routerLink="." [queryParams]="{ status: status() || null, page: r.page + 1 }" queryParamsHandling="merge">Trang sau →</a> }
        </nav>
      }
    }
  `,
})
export class AdminBookings {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);
  protected readonly filters = FILTERS;
  protected readonly message = signal('');

  protected readonly status = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('status') ?? '')), { initialValue: '' });
  protected readonly result = toSignal(
    this.route.queryParamMap.pipe(
      switchMap((q) => this.api.adminBookings({ status: q.get('status'), page: q.get('page') })),
      tap(() => this.message.set('')),
    ),
  );

  protected update(booking: AdminBooking, status: string): void {
    this.api.updateBookingStatus(booking.id, status).subscribe((updated) => {
      booking.status = updated.status;
      this.message.set(`Đã cập nhật lịch hẹn ${booking.code}`);
    });
  }
}
