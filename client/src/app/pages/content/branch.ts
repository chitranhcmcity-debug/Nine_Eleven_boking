import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../../core/api';

@Component({
  selector: 'app-branch',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (branch(); as b) {
      <section class="content-section detail-grid">
        <img class="detail-image" [src]="b.image" [alt]="b.name" />
        <div class="detail-copy">
          <p class="overline">YOUR NEIGHBORHOOD BARBER</p>
          <h1>{{ b.name }}</h1>
          <p>{{ b.address }}</p>
          <p>{{ b.description }}</p>
          <p>Giờ mở cửa: 10:00 — 20:00 mỗi ngày.</p>
          <a class="button" routerLink="/dat-lich">ĐẶT LỊCH TẠI ĐÂY ↗</a>
          <p><a [href]="mapUrl(b.name, b.address)" target="_blank" rel="noopener noreferrer">Xem trên bản đồ ↗</a></p>
        </div>
      </section>
    } @else if (branch() === null) {
      <section class="content-section"><div class="empty-state"><h2>Không tìm thấy chi nhánh</h2><a routerLink="/chi-nhanh">← Tất cả chi nhánh</a></div></section>
    }
  `,
})
export class BranchPage {
  private readonly api = inject(Api);
  protected readonly branch = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => this.api.branch(p.get('slug')!).pipe(catchError(() => of(null)))),
    ),
  );

  protected mapUrl(name: string, address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
  }
}
