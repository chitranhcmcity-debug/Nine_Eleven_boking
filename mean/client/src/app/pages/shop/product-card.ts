import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart } from '../../core/cart';
import { VndPipe } from '../../core/format';
import { Product } from '../../core/models';

/** Display names for the category slugs stored with each product. */
export const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Chăm sóc tóc',
  'dung-cu-barber': 'Dụng cụ Barber',
  'thoi-trang': 'Thời trang & Phụ kiện',
};

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, VndPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
    .pc { display: flex; flex-direction: column; height: 100%; }
    .pc-image { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border-radius: 4px; background: #14110f; }
    .pc-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s; }
    .pc:hover .pc-image img { transform: scale(1.04); }
    .pc-badge { position: absolute; left: 10px; top: 10px; padding: 4px 8px; border-radius: 2px; background: #c1272d; color: #fff; font: 800 12px/1 Manrope, Arial, sans-serif; letter-spacing: .5px; }
    .pc-badge.out { background: #2a2a2a; }
    .pc-info { display: flex; flex: 1; flex-direction: column; gap: 2px; padding-top: 12px; }
    .pc-name { margin: 0; font: 800 14px/1.3 Manrope, Arial, sans-serif; text-transform: uppercase; color: #161616; }
    .pc-name a:hover { color: #c1272d; }
    .pc-cat { font-size: 13px; color: #6b665e; }
    .pc-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 8px; }
    .pc-price { font: 800 18px/1 Manrope, Arial, sans-serif; color: #161616; }
    .pc-add { display: grid; flex: none; place-items: center; width: 40px; height: 40px; padding: 0; border: 1px solid #161616; border-radius: 4px; background: #fff; color: #161616; cursor: pointer; transition: background .15s, color .15s; }
    .pc-add:hover:not(:disabled) { background: #161616; color: #fff; }
    .pc-add:disabled { border-color: #d6d1c8; color: #b4aea4; cursor: not-allowed; }
    .pc-add.added { border-color: #1d8a45; background: #1d8a45; color: #fff; }
    .pc-add svg { width: 20px; height: 20px; }
    :host(.list) .pc { flex-direction: row; gap: 20px; align-items: center; }
    :host(.list) .pc-image { flex: none; width: 160px; }
    :host(.list) .pc-info { flex: 1; padding-top: 0; }
  `,
  template: `
    <article class="pc">
      <a class="pc-image" [routerLink]="['/mua-sam', product().slug]" [attr.aria-label]="product().name">
        <img [src]="product().image" [alt]="product().name" loading="lazy" width="400" height="400" />
        @if (product().stock < 1) {
          <span class="pc-badge out">HẾT HÀNG</span>
        } @else if (product().badge) {
          <span class="pc-badge">{{ product().badge }}</span>
        }
      </a>
      <div class="pc-info">
        <h3 class="pc-name"><a [routerLink]="['/mua-sam', product().slug]">{{ product().name }}</a></h3>
        <span class="pc-cat">{{ category() }}</span>
        <div class="pc-foot">
        <strong class="pc-price">{{ product().price | vnd }}₫</strong>
        <button type="button" class="pc-add" [class.added]="added()" [disabled]="product().stock < 1" [attr.aria-label]="'Thêm ' + product().name + ' vào giỏ'" (click)="add()">
          @if (added()) {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11h10.200L20 8H6.200M9 20h.01M17 20h.01" /></svg>
          }
        </button>
        </div>
      </div>
    </article>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  private readonly cart = inject(Cart);
  protected readonly added = signal(false);

  protected readonly category = computed(() => CATEGORY_LABELS[this.product().category] ?? this.product().category);

  protected add(): void {
    this.cart.add(this.product(), 1);
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1200);
  }
}
