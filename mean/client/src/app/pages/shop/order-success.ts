import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { VndPipe } from '../../core/format';

@Component({
  selector: 'app-order-success',
  imports: [RouterLink, VndPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="reading">
      @if (order(); as o) {
        <p class="overline">THANK YOU FOR YOUR ORDER</p>
        <h1>ĐÃ NHẬN ĐƠN HÀNG!</h1>
        <p>Mã đơn: <strong>{{ o.code }}</strong></p>
        <p>Xin chào {{ o.name }}, đơn hàng đang chờ xác nhận. Thanh toán khi nhận hàng.</p>
        @for (item of o.items; track item.name) {
          <div class="total-row"><span>{{ item.name }} × {{ item.quantity }}</span><b>{{ item.price * item.quantity | vnd }} ₫</b></div>
        }
        <div class="total-row"><span>Giao hàng</span><b>{{ o.shipping | vnd }} ₫</b></div>
        <div class="total-row"><b>Tổng cộng</b><b>{{ o.total | vnd }} ₫</b></div>
        <p>Giao đến: {{ o.address }}</p>
      } @else if (order() === null) {
        <h1>KHÔNG TÌM THẤY ĐƠN HÀNG</h1>
      }
      <a class="button" routerLink="/mua-sam">TIẾP TỤC KHÁM PHÁ →</a>
    </section>
  `,
})
export class OrderSuccess {
  private readonly api = inject(Api);
  protected readonly order = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => this.api.order(p.get('code')!).pipe(catchError(() => of(null)))),
    ),
  );
}
