import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Cart } from '../core/cart';
import { StyleLoader } from '../core/style-loader';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Đến nội dung</a>
    <div class="top-notice">
      NINEELEVEN VỪA RA MẮT TẠI <a routerLink="/chi-nhanh">22 HOÀNG XUÂN HOÀNH, PHÚ THẠNH, THÀNH PHỐ HỒ CHÍ MINH ↗</a>
    </div>
    <header class="store-header is-dark">
      <a class="brand" routerLink="/" aria-label="NineEleven trang chủ"><img class="brand-logo" src="images/nineeleven-logo.png" alt="" width="150" height="68" /></a>
      <button class="mobile-toggle" aria-label="Mở điều hướng" [attr.aria-expanded]="menuOpen()" aria-controls="main-nav" (click)="menuOpen.set(!menuOpen())"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
      <nav id="main-nav" class="main-nav" [class.is-open]="menuOpen()" aria-label="Điều hướng chính" (click)="menuOpen.set(false)">
        <div class="shop-menu">
          <a routerLink="/mua-sam" routerLinkActive="is-active" ariaCurrentWhenActive="page">MUA SẮM <sup>MỚI</sup>⌄</a>
          <div class="mega-menu">
            <div>
              <b>GROOMING</b>
              <a routerLink="/mua-sam" [queryParams]="{ category: 'grooming' }">Pomade, Clay & Wax</a>
              <a routerLink="/mua-sam" [queryParams]="{ q: 'tonic' }">Dầu gội & dưỡng tóc</a>
            </div>
            <div>
              <b>THỜI TRANG</b>
              <a routerLink="/mua-sam" [queryParams]="{ category: 'thoi-trang' }">NineEleven Merchandise</a>
              <a routerLink="/mua-sam" [queryParams]="{ q: 'hat' }">Phụ kiện</a>
            </div>
            <div>
              <b>THƯƠNG HIỆU</b>
              @for (brand of brands; track brand) {
                <a routerLink="/mua-sam" [queryParams]="{ brand: brand }">{{ brand }}</a>
              }
            </div>
          </div>
        </div>
        <a routerLink="/hoc-barber" routerLinkActive="is-active" ariaCurrentWhenActive="page">HỌC BARBER</a>
        <a routerLink="/chi-nhanh" routerLinkActive="is-active" ariaCurrentWhenActive="page">CHI NHÁNH</a>
        <a routerLink="/tin-tuc" routerLinkActive="is-active" ariaCurrentWhenActive="page">TIN TỨC</a>
        <a routerLink="/dat-lich" routerLinkActive="is-active" ariaCurrentWhenActive="page">ĐẶT LỊCH ↗</a>
      </nav>
      <div class="header-actions">
        <button aria-label="Mở tìm kiếm" [attr.aria-expanded]="searchOpen()" aria-controls="search-panel" (click)="searchOpen.set(!searchOpen())"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></button>
        <a routerLink="/gio-hang" aria-label="Giỏ hàng">TÚI <span class="cart-count">{{ cart.count() }}</span></a>
        <a class="ask-barber" routerLink="/tu-van">HỎI BARBER ↗</a>
      </div>
    </header>
    <form class="search-panel" id="search-panel" [hidden]="!searchOpen()" (submit)="search($event)">
      <label for="site-search">Tìm sản phẩm</label>
      <input id="site-search" name="q" [(ngModel)]="query" placeholder="Tìm pomade, clay, thương hiệu…" />
      <button class="button">TÌM KIẾM →</button>
    </form>
    <main id="main"><router-outlet /></main>
    <section class="booking-band">
      <div><small>GOOD HAIR. GOOD MOOD.</small><h2>ĐẾN NINEELEVEN, LÀM MỚI BẠN.</h2></div>
      <a class="button white" routerLink="/dat-lich">ĐẶT LỊCH NGAY ↗</a>
    </section>
    <footer class="store-footer">
      <div>
        <img class="footer-logo" src="images/nineeleven-logo.png" alt="NineEleven" width="180" height="82" />
        <p>BARBER · GROOMING · CULTURE<br />Một mái tóc. Một phong cách. Một cộng đồng.</p>
      </div>
      <div>
        <h3>KHÁM PHÁ</h3>
        <a routerLink="/mua-sam">Mua sắm</a>
        <a routerLink="/chi-nhanh">Hệ thống chi nhánh</a>
        <a routerLink="/hoc-barber">Học nghề barber</a>
        <a routerLink="/tin-tuc">Tin tức underground</a>
      </div>
      <div>
        <h3>HỖ TRỢ</h3>
        <a routerLink="/chinh-sach/giao-hang">Giao hàng & thanh toán</a>
        <a routerLink="/chinh-sach/doi-tra">Đổi trả sản phẩm</a>
        <a routerLink="/chinh-sach/bao-mat">Chính sách bảo mật</a>
        <a routerLink="/tu-van">Liên hệ & tư vấn</a>
      </div>
      <div>
        <h3>GIỜ MỞ CỬA</h3>
        <p>10:00 — 20:00<br />Thứ Hai — Chủ Nhật</p>
        <a routerLink="/dat-lich">Đặt lịch online →</a>
        <a routerLink="/admin/login">Quản trị</a>
      </div>
      <div class="footer-bottom">© {{ year }} NINEELEVEN BARBER STUDIO <span>BARBER IS A LIFESTYLE.</span></div>
    </footer>
  `,
})
export class StorefrontLayout {
  protected readonly cart = inject(Cart);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected query = '';
  protected readonly year = new Date().getFullYear();
  protected readonly brands = ['BROSH', 'HOLUP', 'KBP'];

  constructor() {
    const detach = inject(StyleLoader).attach(['css/app.css', 'css/storefront.css', 'css/storefront-polish.css'], 'storefront');
    inject(DestroyRef).onDestroy(detach);
  }

  protected search(event: Event): void {
    event.preventDefault();
    this.searchOpen.set(false);
    this.router.navigate(['/mua-sam'], { queryParams: { q: this.query.trim() || null } });
  }
}
