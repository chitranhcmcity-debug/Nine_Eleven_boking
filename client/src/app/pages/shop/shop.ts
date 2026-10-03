import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { CATEGORY_LABELS, ProductCard } from './product-card';

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'featured', label: 'Nổi bật' },
];

const PRICE_RANGES = [
  { label: 'Dưới 300.000₫', min: '', max: '300000' },
  { label: '300.000₫ – 500.000₫', min: '300000', max: '500000' },
  { label: '500.000₫ – 700.000₫', min: '500000', max: '700000' },
  { label: 'Trên 700.000₫', min: '700000', max: '' },
];

type Query = Record<string, string>;

@Component({
  selector: 'app-shop',
  imports: [FormsModule, RouterLink, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; background: #fff; color: #161616; }
    svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
    .sh-hero { position: relative; overflow: hidden; padding: 56px 4% 58px; text-align: center; color: #fff; background: linear-gradient(90deg, #0b0b0b 0%, rgb(11 11 11 / 70%) 55%, rgb(11 11 11 / 40%) 100%), url('/images/nineeleven-hero.png') 60% 30% / cover no-repeat #0b0b0b; }
    .sh-hero p { position: relative; margin: 0; }
    .sh-crumb { margin-bottom: 18px !important; font-size: 13px; letter-spacing: .5px; color: #c9c4bb; }
    .sh-hero h1 { position: relative; margin: 0 0 14px; font: 700 clamp(44px, 6.4vw, 92px)/1 Oswald, 'Archivo Black', Impact, sans-serif; letter-spacing: -.5px; text-transform: uppercase; }
    .sh-sub { font-size: 15px; color: #e9e5de; }

    .sh-bar { background: #181818; padding: 0 4%; }
    .sh-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; max-width: 1560px; margin: 0 auto; padding: 22px 0; }
    .sh-search { display: flex; flex: 1 1 280px; width: auto; align-items: center; gap: 12px; padding: 0 4px 10px; border-bottom: 1px solid #5a5a5a; color: #fff; }
    .sh-search svg { flex: none; width: 22px; height: 22px; }
    .sh-search input { flex: 1; width: auto; min-width: 0; padding: 0; border: 0; outline: 0; background: transparent; color: #fff; font: inherit; font-size: 16px; }
    .sh-search input::placeholder { color: #a8a29a; }
    .sh-select { width: auto; flex: none; height: 44px; padding: 0 34px 0 16px; border: 1px solid #6a6a6a; border-radius: 3px; background: #181818 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") right 12px center no-repeat; color: #fff; font: inherit; font-size: 15px; appearance: none; cursor: pointer; }
    .sh-apply { flex: none; width: auto; height: 52px; padding: 0 38px; border: 0; border-radius: 3px; background: #fff; color: #161616; font: 800 16px Manrope, Arial, sans-serif; cursor: pointer; transition: background .15s, color .15s; }
    .sh-apply:hover { background: #c1272d; color: #fff; }

    .sh-body { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 36px; max-width: 1560px; margin: 0 auto; padding: 36px 4% 72px; }
    .sh-side { border-right: 1px solid #e8e4dc; padding-right: 30px; }
    .sh-group { padding: 6px 0 22px; border-bottom: 1px solid #e8e4dc; margin-bottom: 22px; }
    .sh-group:last-child { border-bottom: 0; }
    .sh-group-head { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 0 0 14px; border: 0; background: none; font: 800 16px Manrope, Arial, sans-serif; letter-spacing: .3px; text-transform: uppercase; color: #161616; cursor: pointer; }
    .sh-group-head svg { width: 16px; height: 16px; }
    .sh-links { display: grid; gap: 4px; }
    .sh-links a { display: block; padding: 8px 0; font-size: 15px; color: #4b463f; }
    .sh-links a:hover { color: #161616; }
    .sh-links a.on { color: #c1272d; font-weight: 700; }

    .sh-tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 24px; }
    .sh-count { font-size: 16px; color: #161616; }
    .sh-tools-right { display: flex; align-items: center; gap: 18px; }
    .sh-sort { display: flex; align-items: center; gap: 10px; white-space: nowrap; color: #6b665e; }
    .sh-sort select { width: auto; border: 0; background: transparent; font: 600 15px Manrope, Arial, sans-serif; color: #161616; cursor: pointer; }
    .sh-views { display: flex; gap: 6px; }
    .sh-view { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #d6d1c8; border-radius: 3px; background: #fff; color: #161616; cursor: pointer; }
    .sh-view svg { width: 20px; height: 20px; }
    .sh-view.on { border-color: #161616; background: #161616; color: #fff; }

    .sh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 34px 26px; }
    .sh-grid.list { grid-template-columns: minmax(0, 1fr); gap: 20px; }
    .sh-empty { grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: #6b665e; }
    .sh-empty a { color: #c1272d; font-weight: 700; }
    .sh-pager { display: flex; align-items: center; justify-content: center; gap: 22px; margin-top: 44px; font-size: 15px; }
    .sh-pager a { color: #c1272d; font-weight: 700; }
    .sh-pager .off { color: #b4aea4; }

    @media (max-width: 980px) {
      .sh-body { grid-template-columns: minmax(0, 1fr); padding-top: 24px; }
      .sh-side { display: flex; flex-wrap: wrap; gap: 0 36px; border-right: 0; padding-right: 0; }
      .sh-group { border-bottom: 0; margin-bottom: 8px; }
    }
  `,
  template: `
    <section class="sh-hero">
      <p class="sh-crumb">TRANG CHỦ / MUA SẮM</p>
      <h1>Grooming &amp; Lifestyle</h1>
      <p class="sh-sub">Chọn sản phẩm. Giữ chất riêng.</p>
    </section>

    @if (view(); as v) {
      <div class="sh-bar">
        <form class="sh-form" (submit)="apply($event, v.query)" role="search">
          <label class="sh-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input name="q" [ngModel]="v.query['q'] ?? ''" (ngModelChange)="draft['q'] = $event" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm…" />
          </label>
          <select class="sh-select" name="category" [ngModel]="v.query['category'] ?? ''" (ngModelChange)="draft['category'] = $event" aria-label="Danh mục">
            <option value="">Tất cả danh mục</option>
            @for (c of categories; track c.slug) { <option [value]="c.slug">{{ c.label }}</option> }
          </select>
          <select class="sh-select" name="brand" [ngModel]="v.query['brand'] ?? ''" (ngModelChange)="draft['brand'] = $event" aria-label="Thương hiệu">
            <option value="">Thương hiệu</option>
            @for (brand of v.result.brands; track brand) { <option [value]="brand">{{ brand }}</option> }
          </select>
          <select class="sh-select" name="sort" [ngModel]="v.query['sort'] ?? 'newest'" (ngModelChange)="draft['sort'] = $event" aria-label="Sắp xếp">
            @for (s of sorts; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
          </select>
          <button class="sh-apply">LỌC →</button>
        </form>
      </div>

      <div class="sh-body">
        <aside class="sh-side" aria-label="Bộ lọc">
          <div class="sh-group">
            <button type="button" class="sh-group-head" [attr.aria-expanded]="open().category" (click)="toggle('category')">
              Danh mục
              <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="open().category ? 'M5 12h14' : 'M12 5v14M5 12h14'" /></svg>
            </button>
            @if (open().category) {
              <nav class="sh-links">
                <a routerLink="/mua-sam" [queryParams]="link(v.query, { category: null })" [class.on]="!v.query['category']">Tất cả sản phẩm</a>
                @for (c of categories; track c.slug) {
                  <a routerLink="/mua-sam" [queryParams]="link(v.query, { category: c.slug })" [class.on]="v.query['category'] === c.slug">{{ c.label }}</a>
                }
              </nav>
            }
          </div>
          <div class="sh-group">
            <button type="button" class="sh-group-head" [attr.aria-expanded]="open().brand" (click)="toggle('brand')">
              Thương hiệu
              <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="open().brand ? 'M5 12h14' : 'M12 5v14M5 12h14'" /></svg>
            </button>
            @if (open().brand) {
              <nav class="sh-links">
                <a routerLink="/mua-sam" [queryParams]="link(v.query, { brand: null })" [class.on]="!v.query['brand']">Tất cả thương hiệu</a>
                @for (brand of v.result.brands; track brand) {
                  <a routerLink="/mua-sam" [queryParams]="link(v.query, { brand: brand })" [class.on]="v.query['brand'] === brand">{{ brand }}</a>
                }
              </nav>
            }
          </div>
          <div class="sh-group">
            <button type="button" class="sh-group-head" [attr.aria-expanded]="open().price" (click)="toggle('price')">
              Giá
              <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="open().price ? 'M5 12h14' : 'M12 5v14M5 12h14'" /></svg>
            </button>
            @if (open().price) {
              <nav class="sh-links">
                <a routerLink="/mua-sam" [queryParams]="link(v.query, { minPrice: null, maxPrice: null })" [class.on]="!v.query['minPrice'] && !v.query['maxPrice']">Tất cả mức giá</a>
                @for (r of ranges; track r.label) {
                  <a routerLink="/mua-sam" [queryParams]="link(v.query, { minPrice: r.min || null, maxPrice: r.max || null })" [class.on]="(v.query['minPrice'] ?? '') === r.min && (v.query['maxPrice'] ?? '') === r.max">{{ r.label }}</a>
                }
              </nav>
            }
          </div>
        </aside>

        <section>
          <div class="sh-tools">
            <span class="sh-count">{{ v.result.total }} sản phẩm</span>
            <div class="sh-tools-right">
              <label class="sh-sort">Sắp xếp:
                <select [value]="v.query['sort'] ?? 'newest'" (change)="sortBy($any($event.target).value, v.query)" aria-label="Sắp xếp">
                  @for (s of sorts; track s.value) { <option [value]="s.value" [selected]="(v.query['sort'] ?? 'newest') === s.value">{{ s.label }}</option> }
                </select>
              </label>
              <div class="sh-views" role="group" aria-label="Kiểu hiển thị">
                <button type="button" class="sh-view" [class.on]="!list()" [attr.aria-pressed]="!list()" aria-label="Dạng lưới" (click)="list.set(false)">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
                </button>
                <button type="button" class="sh-view" [class.on]="list()" [attr.aria-pressed]="list()" aria-label="Dạng danh sách" (click)="list.set(true)">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="sh-grid" [class.list]="list()">
            @for (p of v.result.data; track p.id) {
              <app-product-card [product]="p" [class.list]="list()" />
            } @empty {
              <div class="sh-empty"><h2>Không tìm thấy sản phẩm</h2><a routerLink="/mua-sam">Xóa bộ lọc →</a></div>
            }
          </div>

          @if (v.result.lastPage > 1) {
            <nav class="sh-pager" aria-label="Phân trang">
              @if (v.result.page > 1) { <a routerLink="/mua-sam" [queryParams]="link(v.query, { page: v.result.page - 1 })">← Trang trước</a> } @else { <span class="off">← Trang trước</span> }
              <span>Trang {{ v.result.page }} / {{ v.result.lastPage }}</span>
              @if (v.result.page < v.result.lastPage) { <a routerLink="/mua-sam" [queryParams]="link(v.query, { page: v.result.page + 1 })">Trang sau →</a> } @else { <span class="off">Trang sau →</span> }
            </nav>
          }
        </section>
      </div>
    }
  `,
})
export class Shop {
  private readonly api = inject(Api);
  private readonly router = inject(Router);

  protected readonly sorts = SORTS;
  protected readonly ranges = PRICE_RANGES;
  protected readonly categories = Object.entries(CATEGORY_LABELS).map(([slug, label]) => ({ slug, label }));
  protected draft: Query = {};
  protected readonly list = signal(false);
  protected readonly open = signal({ category: true, brand: false, price: false });

  protected readonly view = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((params): Query => Object.fromEntries(params.keys.map((key) => [key, params.get(key) ?? '']))),
      switchMap((query) => this.api.products(query).pipe(map((result) => ({ query, result })))),
    ),
  );

  protected toggle(group: 'category' | 'brand' | 'price'): void {
    this.open.update((state) => ({ ...state, [group]: !state[group] }));
  }

  /** Query parameters for a sidebar link: current filters with the given changes, back to page 1. */
  protected link(current: Query, changes: Record<string, string | number | null>): Record<string, string | number | null> {
    return { ...current, page: null, ...changes };
  }

  protected sortBy(sort: string, current: Query): void {
    this.router.navigate(['/mua-sam'], { queryParams: this.link(current, { sort: sort === 'newest' ? null : sort }) });
  }

  protected apply(event: Event, current: Query): void {
    event.preventDefault();
    const merged = { ...current, ...this.draft, page: undefined };
    const queryParams = Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v || null]));
    this.draft = {};
    this.router.navigate(['/mua-sam'], { queryParams });
  }
}
