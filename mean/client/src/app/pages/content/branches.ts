import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { Branch } from '../../core/models';

const DEFAULT_CITY = 'TP. Hồ Chí Minh';
const HOURS = '10:00 - 20:00';

@Component({
  selector: 'app-branches',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; background: #f4f1ec; }
    svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
    .br-top { position: relative; overflow: hidden; padding: 56px 4% 8px; text-align: center; }
    .br-top::before { content: 'NINEELEVEN'; position: absolute; left: -2%; top: 22px; font: italic 900 clamp(120px, 17vw, 260px)/1 'Archivo Black', Arial, sans-serif; letter-spacing: -6px; color: #161616; opacity: .05; transform: rotate(-6deg); pointer-events: none; white-space: nowrap; }
    .br-kicker { position: relative; margin: 0 0 14px; color: #c1272d; font-size: 13px; letter-spacing: 2px; }
    .br-top h1 { position: relative; margin: 0 0 12px; font: 800 clamp(34px, 4.4vw, 62px)/1.1 Manrope, Arial, sans-serif; letter-spacing: -.5px; color: #161616; }
    .br-top h1 em { color: #c1272d; font-style: normal; }
    .br-lead { position: relative; margin: 0 0 40px; font-size: 16px; color: #6b665e; }
    .br-wrap { max-width: 1500px; margin: 0 auto; padding: 0 4% 72px; }
    .br-search { position: relative; display: flex; max-width: 1000px; margin: 0 auto 28px; border: 1px solid #e3ded6; background: #fff; box-shadow: 0 10px 30px rgb(40 30 20 / 6%); }
    .br-search label { display: flex; flex: 1; align-items: center; gap: 14px; padding: 0 20px; }
    .br-search svg { flex: none; width: 22px; height: 22px; }
    .br-search input { flex: 1; min-width: 0; height: 62px; border: 0; outline: 0; background: transparent; font: inherit; font-size: 16px; color: #161616; }
    .br-search input::placeholder { color: #9a948a; }
    .br-search button { display: flex; align-items: center; gap: 12px; padding: 0 38px; border: 0; background: #111; color: #fff; font: 800 17px Manrope, Arial, sans-serif; cursor: pointer; transition: background .15s; }
    .br-search button:hover { background: #c1272d; }
    .br-search button svg { width: 20px; height: 20px; }

    .br-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 26px; }
    .br-chips { display: flex; flex-wrap: wrap; gap: 12px; }
    .br-chip { padding: 11px 22px; border: 1px solid #e3ded6; border-radius: 999px; background: #fff; font: 500 15px Manrope, Arial, sans-serif; color: #161616; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
    .br-chip:hover { border-color: #161616; }
    .br-chip.on { border-color: #111; background: #111; color: #fff; }
    .br-views { display: flex; gap: 8px; padding-left: 20px; border-left: 1px solid #ddd7cd; }
    .br-view { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border: 0; border-bottom: 2px solid transparent; background: transparent; font: 500 15px Manrope, Arial, sans-serif; color: #161616; cursor: pointer; }
    .br-view svg { width: 18px; height: 18px; }
    .br-view.on { color: #c1272d; border-bottom-color: #c1272d; }

    .br-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 26px; }
    .br-card { display: flex; flex-direction: column; overflow: hidden; border-radius: 10px; background: #fff; box-shadow: 0 6px 24px rgb(40 30 20 / 8%); transition: transform .2s, box-shadow .2s; }
    .br-card:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgb(40 30 20 / 14%); }
    .br-photo { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: #111; }
    .br-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
    .br-card:hover .br-photo img { transform: scale(1.04); }
    .br-badge { position: absolute; left: 14px; top: 14px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: rgb(17 17 17 / 78%); color: #fff; font: 700 12px Manrope, Arial, sans-serif; letter-spacing: .3px; text-transform: uppercase; }
    .br-badge::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: #e0262d; }
    .br-body { padding: 18px 22px 22px; }
    .br-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .br-head h2 { margin: 0; font: 800 19px/1.25 Manrope, Arial, sans-serif; color: #161616; }
    .br-head a { flex: none; display: inline-flex; align-items: center; gap: 6px; font: 600 14px Manrope, Arial, sans-serif; color: #c1272d; }
    .br-head a svg { width: 14px; height: 14px; }
    .br-meta { display: flex; flex-wrap: wrap; gap: 10px 22px; font-size: 14px; color: #4b463f; }
    .br-meta span { display: inline-flex; align-items: center; gap: 8px; }
    .br-meta svg { flex: none; width: 18px; height: 18px; color: #161616; }

    .br-list { grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .br-list .br-card { flex-direction: row; }
    .br-list .br-photo { flex: none; width: 280px; aspect-ratio: 16 / 10; }
    .br-list .br-body { display: flex; flex: 1; flex-direction: column; justify-content: center; }

    .br-empty { padding: 60px 20px; text-align: center; border-radius: 10px; background: #fff; color: #6b665e; }

    @media (max-width: 720px) {
      .br-search { flex-direction: column; }
      .br-search button { justify-content: center; height: 52px; }
      .br-views { padding-left: 0; border-left: 0; }
      .br-grid { grid-template-columns: minmax(0, 1fr); }
      .br-list .br-card { flex-direction: column; }
      .br-list .br-photo { width: auto; }
    }
  `,
  template: `
    <section class="br-top">
      <p class="br-kicker">FIND YOUR CUTCLUB</p>
      <h1>HỆ THỐNG <em>CHI NHÁNH</em></h1>
      <p class="br-lead">Chọn địa điểm, đặt một chiếc ghế dành riêng cho bạn.</p>
    </section>

    <div class="br-wrap">
      <form class="br-search" (submit)="search($event)" role="search">
        <label>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.800 7 12 7 12zM12 11.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z" /></svg>
          <input name="q" [(ngModel)]="q" placeholder="Tìm quận, tên chi nhánh..." aria-label="Tìm chi nhánh" />
        </label>
        <button>TÌM KIẾM <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      </form>

      <div class="br-bar">
        <div class="br-chips" role="group" aria-label="Lọc theo thành phố">
          <button type="button" class="br-chip" [class.on]="!city()" [attr.aria-pressed]="!city()" (click)="city.set('')">Tất cả</button>
          @for (c of cities(); track c) {
            <button type="button" class="br-chip" [class.on]="city() === c" [attr.aria-pressed]="city() === c" (click)="city.set(c)">{{ c }}</button>
          }
        </div>
        <div class="br-views" role="group" aria-label="Kiểu hiển thị">
          <button type="button" class="br-view" [class.on]="view() === 'grid'" [attr.aria-pressed]="view() === 'grid'" (click)="view.set('grid')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>Lưới
          </button>
          <button type="button" class="br-view" [class.on]="view() === 'list'" [attr.aria-pressed]="view() === 'list'" (click)="view.set('list')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>Danh sách
          </button>
        </div>
      </div>

      @if (visible(); as list) {
        <div class="br-grid" [class.br-list]="view() === 'list'">
          @for (b of list; track b.id) {
            <article class="br-card">
              <a class="br-photo" [routerLink]="['/chi-nhanh', b.slug]" [attr.aria-label]="b.name">
                <img [src]="b.image" [alt]="b.name" loading="lazy" />
                <span class="br-badge">{{ cityOf(b) }}</span>
              </a>
              <div class="br-body">
                <div class="br-head">
                  <h2>{{ b.name }}</h2>
                  <a [routerLink]="['/chi-nhanh', b.slug]">Xem chi tiết <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
                </div>
                <div class="br-meta">
                  <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.800 7 12 7 12zM12 11.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z" /></svg>{{ b.address }}</span>
                  <span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{{ hours }}</span>
                </div>
              </div>
            </article>
          } @empty {
            <div class="br-empty">Không tìm thấy chi nhánh phù hợp.</div>
          }
        </div>
      }
    </div>
  `,
})
export class Branches {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly hours = HOURS;
  protected q = this.route.snapshot.queryParamMap.get('q') ?? '';
  protected readonly city = signal('');
  protected readonly view = signal<'grid' | 'list'>('grid');

  protected readonly branches = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('q') ?? ''),
      switchMap((q) => this.api.branches(q)),
    ),
  );

  protected readonly cities = computed(() => [...new Set((this.branches() ?? []).map((b) => this.cityOf(b)))]);
  protected readonly visible = computed(() => {
    const list = this.branches();
    return list && (this.city() ? list.filter((b) => this.cityOf(b) === this.city()) : list);
  });

  protected cityOf(branch: Branch): string {
    return branch.city || DEFAULT_CITY;
  }

  protected search(event: Event): void {
    event.preventDefault();
    this.city.set('');
    this.router.navigate(['/chi-nhanh'], { queryParams: { q: this.q.trim() || null } });
  }
}
