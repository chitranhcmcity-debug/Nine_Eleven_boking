import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../core/api';
import { SALON_TZ } from '../core/format';

@Component({
  selector: 'app-booking-success',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="success-page">
      @if (booking(); as b) {
        <div class="success-mark">✓</div>
        <p class="eyebrow">YOUR CHAIR IS RESERVED</p>
        <h1>HẸN GẶP BẠN<br />TẠI <em>NINEELEVEN.</em></h1>
        <div class="ticket">
          <span>MÃ LỊCH HẸN</span>
          <strong>{{ b.code }}</strong>
          <p>{{ b.startsAt | date: 'HH:mm · dd/MM/yyyy' : tz }}</p>
        </div>
        <p>Chúng tôi sẽ sớm liên hệ xác nhận. Vui lòng đến trước giờ hẹn 5 phút.</p>
      } @else if (booking() === null) {
        <h1>KHÔNG TÌM THẤY<br /><em>LỊCH HẸN.</em></h1>
      }
      <a routerLink="/" class="btn">VỀ TRANG CHỦ ↗</a>
    </section>
  `,
})
export class BookingSuccess {
  private readonly api = inject(Api);
  protected readonly tz = SALON_TZ;
  protected readonly booking = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => this.api.booking(p.get('code')!).pipe(catchError(() => of(null)))),
    ),
  );
}
