import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { SALON_TZ } from '../../core/format';

@Component({
  selector: 'app-articles',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-heading"><p>THE CUTCLUB JOURNAL</p><h1>TIN TỨC UNDERGROUND</h1><p>Cảm hứng tóc, grooming và lifestyle.</p></div>
    @if (result(); as r) {
      <section class="content-section">
        <div class="article-list">
          @for (a of r.data; track a.id) {
            <a class="article-card" [routerLink]="['/tin-tuc', a.slug]">
              <img [src]="a.image" [alt]="a.title" loading="lazy" />
              <small>{{ a.createdAt | date: 'dd.MM.yyyy' : tz }} / GROOMING</small>
              <h3>{{ a.title }}</h3>
              <p>{{ a.excerpt }}</p>
            </a>
          } @empty {
            <p>Chưa có bài viết.</p>
          }
        </div>
        @if (r.lastPage > 1) {
          <div class="pagination">
            <nav class="filters" aria-label="Phân trang">
              @if (r.page > 1) { <a routerLink="/tin-tuc" [queryParams]="{ page: r.page - 1 }">← Trang trước</a> } @else { <span>← Trang trước</span> }
              <span>Trang {{ r.page }} / {{ r.lastPage }}</span>
              @if (r.page < r.lastPage) { <a routerLink="/tin-tuc" [queryParams]="{ page: r.page + 1 }">Trang sau →</a> }
            </nav>
          </div>
        }
      </section>
    }
  `,
})
export class Articles {
  private readonly api = inject(Api);
  protected readonly tz = SALON_TZ;
  protected readonly result = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(switchMap((q) => this.api.articles(Number(q.get('page')) || 1))),
  );
}
