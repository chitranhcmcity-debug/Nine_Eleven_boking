import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { SALON_TZ } from '../../core/format';

@Component({
  selector: 'app-admin-customers',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (result(); as r) {
      <section class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>KHÁCH HÀNG</th><th>LIÊN HỆ</th><th>SỐ LẦN ĐẶT</th><th>LẦN CUỐI</th></tr></thead>
            <tbody>
              @for (c of r.data; track c.id) {
                <tr>
                  <td><b>{{ c.name }}</b><small>#{{ c.id.slice(-6).toUpperCase() }}</small></td>
                  <td>{{ c.phone }}<small>{{ c.email }}</small></td>
                  <td>{{ c.bookingsCount }}</td>
                  <td>{{ c.lastVisitAt ? (c.lastVisitAt | date: 'dd/MM/yyyy' : tz) : '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="empty">Chưa có khách hàng.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      @if (r.lastPage > 1) {
        <nav class="filters" aria-label="Phân trang">
          @if (r.page > 1) { <a routerLink="." [queryParams]="{ page: r.page - 1 }">← Trang trước</a> }
          <span>Trang {{ r.page }} / {{ r.lastPage }}</span>
          @if (r.page < r.lastPage) { <a routerLink="." [queryParams]="{ page: r.page + 1 }">Trang sau →</a> }
        </nav>
      }
    }
  `,
})
export class AdminCustomers {
  private readonly api = inject(Api);
  protected readonly tz = SALON_TZ;
  protected readonly result = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(switchMap((q) => this.api.adminCustomers(Number(q.get('page')) || 1))),
  );
}
