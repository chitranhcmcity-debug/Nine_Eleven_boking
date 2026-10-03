import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { SALON_TZ } from '../core/format';
import { ProductCard } from './shop/product-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="video-hero">
      <video #hero autoplay muted loop playsinline preload="auto" (play)="paused.set(false)" (pause)="paused.set(true)">
        <source src="images/banner-nineeleven.mp4" type="video/mp4" />
      </video>
      <div class="hero-shade"></div>
      <div class="video-caption">
        <p>SAIGON'S BARBER CULTURE</p>
        <h1><span class="visually-hidden">NineEleven</span><span class="hero-spacer" aria-hidden="true"></span><span>BARBER STUDIO</span></h1>
        <div>
          <a class="button white" routerLink="/dat-lich">ĐẶT LỊCH ↗</a>
          <a class="button outline" routerLink="/mua-sam">MUA SẮM →</a>
        </div>
      </div>
      <button class="video-toggle" [attr.aria-label]="paused() ? 'Phát video' : 'Tạm dừng video'" (click)="toggleVideo()">{{ paused() ? '▶' : 'Ⅱ' }}</button>
    </section>

    <section class="content-section friends-section">
      <div class="section-title"><h2>BẠN ĐẾN NHÀ</h2><span>GOOD PEOPLE. GREAT HAIR.</span></div>
      <div class="friends-strip">
        @for (n of friends; track n) {
          <img [src]="'images/4rau/celeb' + n + '.webp'" alt="Khách hàng tại NineEleven" loading="lazy" />
        }
      </div>
    </section>

    @if (data(); as d) {
      <section class="content-section">
        <div class="section-title">
          <div><h2>SẢN PHẨM MỚI</h2><p>Những lựa chọn mới cho chất riêng của bạn.</p></div>
          <a routerLink="/mua-sam">TẤT CẢ SẢN PHẨM ↗</a>
        </div>
        <div class="product-grid">@for (p of d.newProducts; track p.id) { <app-product-card [product]="p" /> }</div>
      </section>
      <section class="content-section soft-section">
        <div class="section-title">
          <div><h2>SẢN PHẨM BÁN CHẠY</h2><p>Grooming essentials. Chọn bởi barber.</p></div>
          <a routerLink="/mua-sam" [queryParams]="{ sort: 'featured' }">KHÁM PHÁ ↗</a>
        </div>
        <div class="product-grid">@for (p of d.featuredProducts; track p.id) { <app-product-card [product]="p" /> }</div>
      </section>
      <section class="content-section">
        <div class="section-title">
          <div><h2>TIN TỨC UNDERGROUND</h2><p>Tóc, thời trang và văn hóa đường phố.</p></div>
          <a routerLink="/tin-tuc">XEM THÊM ↗</a>
        </div>
        <div class="editorial-grid">
          @for (a of d.articles; track a.id; let first = $first) {
            <a class="article-card" [class.article-featured]="first" [routerLink]="['/tin-tuc', a.slug]">
              <img [src]="a.image" [alt]="a.title" loading="lazy" />
              <div>
                <small>GROOMING & CULTURE / {{ a.createdAt | date: 'dd.MM.yyyy' : tz }}</small>
                <h3>{{ a.title }}</h3>
                <p>{{ a.excerpt }}</p>
              </div>
            </a>
          }
        </div>
      </section>
      <section class="content-section branch-section">
        <div>
          <p class="overline">FIND YOUR CUTCLUB</p>
          <h2>GẦN BẠN.<br />ĐÚNG CHẤT BẠN.</h2>
          <p>Khám phá hệ thống chi nhánh.<br />Chọn nơi quen, gặp người thợ hiểu bạn.</p>
          <a class="button" routerLink="/chi-nhanh">TÌM CHI NHÁNH ↗</a>
        </div>
        <div class="branch-mosaic">
          @for (b of d.branches; track b.id) {
            <a [routerLink]="['/chi-nhanh', b.slug]"><img [src]="b.image" [alt]="b.name" loading="lazy" /><span>{{ b.name }}</span></a>
          }
        </div>
      </section>
    }
  `,
})
export class Home {
  protected readonly data = toSignal(inject(Api).home());
  protected readonly friends = [13, 17, 3, 11, 14];
  protected readonly tz = SALON_TZ;
  protected readonly paused = signal(false);
  private readonly hero = viewChild.required<ElementRef<HTMLVideoElement>>('hero');

  protected toggleVideo(): void {
    const video = this.hero().nativeElement;
    if (video.paused) {
      video.play().catch(() => this.paused.set(true));
    } else {
      video.pause();
    }
  }
}
