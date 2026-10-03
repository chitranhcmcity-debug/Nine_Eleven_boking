import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { Cart } from '../../core/cart';
import { VndPipe, apiMessage } from '../../core/format';

@Component({
  selector: 'app-cart',
  imports: [FormsModule, RouterLink, VndPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-heading"><p>GROOMING ESSENTIALS</p><h1>GIỎ HÀNG CỦA BẠN</h1></div>
    <section class="content-section">
      @if (error()) { <div class="flash-message error" role="alert">{{ error() }}</div> }
      @if (cart.lines().length === 0) {
        <div class="empty-state">
          <h2>Giỏ hàng đang trống</h2>
          <p>Khám phá sản phẩm phù hợp với phong cách của bạn.</p>
          <a class="button" routerLink="/mua-sam">BẮT ĐẦU MUA SẮM →</a>
        </div>
      } @else {
        <div class="cart-layout">
          <div>
            @for (line of cart.lines(); track line.product.id) {
              <article class="cart-item">
                <img [src]="line.product.image" [alt]="line.product.name" />
                <div>
                  <h3><a [routerLink]="['/mua-sam', line.product.slug]">{{ line.product.name }}</a></h3>
                  <p>{{ line.product.price | vnd }} ₫</p>
                </div>
                <input type="number" min="1" max="20" [value]="line.quantity" [attr.aria-label]="'Số lượng ' + line.product.name" (change)="cart.setQuantity(line.product.id, +$any($event.target).value)" />
                <button type="button" class="text-button" [attr.aria-label]="'Xóa ' + line.product.name" (click)="cart.remove(line.product.id)">×</button>
              </article>
            }
            <a routerLink="/mua-sam">← Tiếp tục mua sắm</a>
          </div>
          <form class="checkout-box" (submit)="submit($event)">
            <h2>THÔNG TIN GIAO HÀNG</h2>
            <label>Họ tên<input name="name" [(ngModel)]="name" autocomplete="name" maxlength="100" required /></label>
            <label>Số điện thoại<input name="phone" [(ngModel)]="phone" autocomplete="tel" required /></label>
            <label>Email (không bắt buộc)<input type="email" name="email" [(ngModel)]="email" autocomplete="email" /></label>
            <label>Địa chỉ đầy đủ<textarea name="address" rows="3" [(ngModel)]="address" required maxlength="500" autocomplete="street-address"></textarea></label>
            <label>Ghi chú<textarea name="notes" rows="2" [(ngModel)]="notes" maxlength="500"></textarea></label>
            <div class="total-row"><span>Tạm tính</span><b>{{ cart.subtotal() | vnd }} ₫</b></div>
            <div class="total-row"><span>Giao hàng</span><b>{{ cart.shipping() ? (cart.shipping() | vnd) + ' ₫' : 'Miễn phí' }}</b></div>
            <div class="total-row"><strong>Tổng thanh toán</strong><strong>{{ cart.subtotal() + cart.shipping() | vnd }} ₫</strong></div>
            <p>Thanh toán khi nhận hàng (COD).</p>
            <button class="button" [disabled]="busy()">ĐẶT HÀNG →</button>
          </form>
        </div>
      }
    </section>
  `,
})
export class CartPage {
  protected readonly cart = inject(Cart);
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  /** Lets the server ignore a double submit of the same checkout. */
  private readonly checkoutToken = crypto.randomUUID();

  protected name = '';
  protected phone = '';
  protected email = '';
  protected address = '';
  protected notes = '';

  protected submit(event: Event): void {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    this.api
      .createOrder({
        name: this.name,
        phone: this.phone,
        email: this.email || undefined,
        address: this.address,
        notes: this.notes || undefined,
        checkoutToken: this.checkoutToken,
        items: this.cart.lines().map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      })
      .subscribe({
        next: ({ code }) => {
          this.cart.clear();
          this.router.navigate(['/don-hang', code]);
        },
        error: (e) => {
          this.error.set(apiMessage(e));
          this.busy.set(false);
        },
      });
  }
}
