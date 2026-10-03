import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SALON_TZ, VndPipe } from '../../core/format';
import { AdminBooking, BOOKING_STATUSES } from '../../core/models';

@Component({
  selector: 'app-booking-table',
  imports: [DatePipe, VndPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>THỜI GIAN</th><th>KHÁCH HÀNG</th><th>DỊCH VỤ / BARBER</th><th>GIÁ TRỊ</th><th>TRẠNG THÁI</th></tr>
        </thead>
        <tbody>
          @for (booking of bookings(); track booking.id) {
            <tr>
              <td>
                <b>{{ booking.startsAt | date: 'HH:mm' : tz }}</b>
                <small>{{ booking.startsAt | date: 'dd/MM/yyyy' : tz }} · {{ booking.code }}</small>
              </td>
              <td><b>{{ booking.customer.name }}</b><small>{{ booking.customer.phone }}</small></td>
              <td><b>{{ booking.service.name }}</b><small>{{ booking.barber.name }}</small></td>
              <td>{{ booking.total | vnd }}đ</td>
              <td>
                <select [value]="booking.status" (change)="statusChange.emit({ booking, status: $any($event.target).value })">
                  @for (status of statuses; track status.value) {
                    <option [value]="status.value" [selected]="booking.status === status.value">{{ status.label }}</option>
                  }
                </select>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="empty">Chưa có lịch hẹn nào.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class BookingTable {
  readonly bookings = input.required<AdminBooking[]>();
  readonly statusChange = output<{ booking: AdminBooking; status: string }>();
  protected readonly statuses = BOOKING_STATUSES;
  protected readonly tz = SALON_TZ;
}
