import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { SALON_TZ } from '../../core/format';

@Component({
  selector: 'app-article',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (article(); as a) {
      <article class="reading">
        <p class="overline">TIN TỨC / {{ a.createdAt | date: 'dd.MM.yyyy' : tz }}</p>
        <h1>{{ a.title }}</h1>
        <p>{{ a.excerpt }}</p>
        <img [src]="a.image" [alt]="a.title" />
        <div class="article-body">{{ a.body }}</div>
        <p><a class="button" routerLink="/dat-lich">TƯ VẤN KIỂU TÓC TẠI TIỆM ↗</a></p>
        <a routerLink="/tin-tuc">← Tất cả tin tức</a>
      </article>
    } @else if (article() === null) {
      <article class="reading"><h1>Không tìm thấy bài viết</h1><a routerLink="/tin-tuc">← Tất cả tin tức</a></article>
    }
  `,
})
export class ArticlePage {
  private readonly api = inject(Api);
  protected readonly tz = SALON_TZ;
  protected readonly article = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => this.api.article(p.get('slug')!).pipe(catchError(() => of(null)))),
    ),
  );
}
