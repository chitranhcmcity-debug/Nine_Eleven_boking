import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { Cart } from '../../core/cart';
import { VndPipe } from '../../core/format';
import { ProductCard } from './product-card';

@Component({
  selector: 'app-product',
  imports: [FormsModule, RouterLink, VndPipe, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as d) {
      <section class="content-section">
        <p class="overline"><a routerLink="/mua-sam">MUA SẮM</a> / {{ d.product.brand }}</p>
        <div class="detail-grid">
          <img class="detail-image" [src]="d.product.image" [alt]="d.product.name" />
          <div class="detail-copy">
            <p class="overline">{{ d.product.brand }} / {{ d.product.category }}</p>
            <h1>{{ d.product.name }}</h1>
            <strong class="price">{{ d.product.price | vnd }} ₫</strong>
            <p>{{ d.product.description }}</p>
            <p>{{ d.product.stock > 0 ? 'Còn ' + d.product.stock + ' sản phẩm' : 'Tạm hết hàng' }}</p>
            @if (d.product.stock > 0) {
              <form class="purchase-form" (submit)="add($event, d.product)">
                <label>Số lượng
                  <input aria-label="Số lượng" type="number" name="quantity" [(ngModel)]="quantity" min="1" [max]="maxQuantity(d.product.stock)" required />
                </label>
                <button class="button">THÊM VÀO GIỎ →</button>
              </form>
            }
            <details open><summary>Giao hàng & thanh toán</summary><p>Phí giao hàng 30.000 ₫. Miễn phí cho đơn từ 1.000.000 ₫. Thanh toán khi nhận hàng (COD).</p></details>
            <details><summary>Cần tư vấn?</summary><p><a routerLink="/tu-van">Gửi câu hỏi cho barber →</a></p></details>
          </div>
        </div>
      </section>
      <section class="content-section soft-section">
        <div class="section-title"><h2>CÓ THỂ BẠN THÍCH</h2></div>
        <div class="product-grid">@for (p of d.related; track p.id) { <app-product-card [product]="p" /> }</div>
      </section>
    } @else if (data() === null) {
      <section class="content-section"><div class="empty-state"><h2>Không tìm thấy sản phẩm</h2><a routerLink="/mua-sam">← Về cửa hàng</a></div></section>
    }
  `,
})
export class ProductPage {
  private readonly api = inject(Api);
  private readonly cart = inject(Cart);
  private readonly router = inject(Router);
  protected quantity = 1;

  protected readonly data = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => this.api.product(p.get('slug')!).pipe(catchError(() => of(null)))),
    ),
  );

  protected maxQuantity(stock: number): number {
    return Math.min(20, stock);
  }

  protected add(event: Event, product: Parameters<Cart['add']>[0]): void {
    event.preventDefault();
    this.cart.add(product, Math.max(1, Math.floor(this.quantity) || 1));
    this.router.navigateByUrl('/gio-hang');
  }
}
