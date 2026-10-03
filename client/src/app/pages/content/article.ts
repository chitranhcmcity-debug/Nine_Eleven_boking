import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { SALON_TZ } from '../../core/format';
import type { Article } from '../../core/models';

const WORDS_PER_MINUTE = 200;

/** The table of contents lists the <h2> headings; ids are not used because the HTML sanitizer strips them. */
function tocLabels(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return [...doc.querySelectorAll('h2')].map((heading) => heading.textContent?.trim() ?? '');
}

@Component({
  selector: 'app-article',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .ar-hero { position: relative; display: grid; place-items: center; min-height: 260px; padding: 48px 4%; text-align: center; color: #fff; background: #0b0b0b var(--ar-image) center / cover no-repeat; }
    .ar-hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(11 11 11 / 82%), rgb(120 12 16 / 62%)); }
    .ar-hero > * { position: relative; max-width: 1100px; }
    .ar-hero h1 { margin: 0; font: 700 clamp(26px, 3.6vw, 44px)/1.2 Manrope, Arial, sans-serif; text-transform: uppercase; }
    .ar-crumb { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 10px; margin: 18px 0 0; padding: 0; list-style: none; font-size: 13px; }
    .ar-crumb li + li::before { content: '/'; margin-right: 10px; opacity: .7; }
    .ar-crumb a { color: #fff; }
    .ar-page { max-width: 880px; margin: 0 auto; padding: 40px 20px 72px; }
    .ar-toc { margin-bottom: 36px; }
    .ar-toc-btn { padding: 8px 16px; border: 1px solid #161616; background: #fff; font: 700 12px Manrope, Arial, sans-serif; letter-spacing: .4px; text-transform: uppercase; cursor: pointer; }
    .ar-toc-list { margin-top: 10px; padding: 18px 22px; border: 1px solid #e3e0da; border-radius: 6px; background: #f8f7f4; }
    .ar-toc-list strong { display: block; margin-bottom: 10px; }
    .ar-toc-list ol { margin: 0; padding-left: 20px; line-height: 2; font-size: 14px; }
    .ar-toc-list a { color: #3b3935; cursor: pointer; }
    .ar-toc-list a:hover { color: #c1272d; }
    .ar-center { text-align: center; }
    .ar-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 28px; font-size: 12px; }
    .ar-meta span { padding: 4px 12px; border: 1px solid #e3e0da; border-radius: 999px; color: #5d5a54; }
    .ar-badge { display: inline-block; margin-bottom: 14px; padding: 4px 14px; border-radius: 999px; background: #6c6862; color: #fff; font-size: 12px; }
    .ar-lead { margin: 0 0 24px; font-size: 18px; line-height: 1.7; color: #3b3935; }
    .ar-body { font-size: 16px; line-height: 1.85; color: #25231f; }
    .ar-body h2 { margin: 48px 0 14px; font: 700 clamp(24px, 3vw, 32px)/1.25 Manrope, Arial, sans-serif; text-align: center; scroll-margin-top: 110px; }
    .ar-body p { margin: 0 0 16px; }
    .ar-body img { display: block; max-width: 100%; height: auto; margin: 20px auto; border-radius: 4px; }
    .ar-body blockquote { margin: 18px 0 24px; padding: 14px 20px; border-left: 4px solid #c1272d; border-radius: 0 6px 6px 0; background: #fdf0ef; font-style: italic; }
    .ar-callout { margin: 0 0 24px; padding: 16px 20px; border-left: 4px solid #c1272d; border-radius: 0 6px 6px 0; background: #fdf0ef; font-size: 15px; line-height: 1.7; }
    .ar-cta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-top: 40px; }
    .ar-cta .button { display: inline-block; padding: 14px 26px; background: #c1272d; color: #fff; font-weight: 800; letter-spacing: .4px; }
    .ar-back { font-weight: 700; color: #c1272d; }
  `,
  template: `
    @if (article(); as a) {
      <section class="ar-hero" [style.--ar-image]="'url(' + a.image + ')'">
        <div>
          <h1>{{ a.title }}</h1>
          <ol class="ar-crumb">
            <li><a routerLink="/">Trang chủ</a></li>
            <li><a routerLink="/tin-tuc">Tin tức</a></li>
            <li>{{ a.category || 'Kiểu tóc' }}</li>
            <li>{{ a.title }}</li>
          </ol>
        </div>
      </section>

      <article class="ar-page">
        @if (content(); as c) {
          @if (c.toc.length) {
            <nav class="ar-toc" aria-label="Mục lục bài viết">
              <button class="ar-toc-btn" type="button" (click)="tocOpen = !tocOpen" [attr.aria-expanded]="tocOpen">Mục lục bài viết</button>
              @if (tocOpen) {
                <div class="ar-toc-list">
                  <strong>Mục lục:</strong>
                  <ol>
                    @for (label of c.toc; track $index) {
                      <li><a (click)="scrollTo($index)">{{ label }}</a></li>
                    }
                  </ol>
                </div>
              }
            </nav>
          }

          <div class="ar-center"><span class="ar-badge">{{ a.category || 'Kiểu tóc' }}</span></div>
          <div class="ar-meta">
            <span>{{ a.createdAt | date: 'dd/MM/yyyy' : tz }}</span>
            <span>{{ readingMinutes() }} phút đọc</span>
          </div>
          <p class="ar-lead">{{ a.excerpt }}</p>
          <div class="ar-body" [innerHTML]="a.body"></div>
        }
        <p class="ar-cta">
          <a class="ar-back" routerLink="/tin-tuc">← Tất cả tin tức</a>
          <a class="button" routerLink="/dat-lich">ĐẶT LỊCH TẠI NINEELEVEN ↗</a>
        </p>
      </article>
    } @else if (article() === null) {
      <article class="ar-page"><h1>Không tìm thấy bài viết</h1><a class="ar-back" routerLink="/tin-tuc">← Tất cả tin tức</a></article>
    }
  `,
})
export class ArticlePage {
  private readonly api = inject(Api);
  protected readonly tz = SALON_TZ;
  protected tocOpen = true;
  protected readonly article = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => this.api.article(p.get('slug')!).pipe(catchError(() => of<Article | null>(null)))),
    ),
  );
  protected readonly content = computed(() => {
    const a = this.article();
    return a ? { toc: tocLabels(a.body ?? '') } : null;
  });
  protected readonly readingMinutes = computed(() => {
    const words = (this.article()?.body ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  });

  protected scrollTo(index: number): void {
    document.querySelectorAll('.ar-body h2')[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
