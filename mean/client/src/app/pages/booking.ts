import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Api } from '../core/api';
import { VndPipe, apiMessage } from '../core/format';
import { Slot } from '../core/models';

/** Today's date in Vietnam as yyyy-MM-dd, used as the minimum bookable day. */
function salonToday(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}

/** Every start time the salon offers (10:00 – 19:30); the server decides which are still free. */
const SLOT_LABELS = Array.from({ length: 20 }, (_, i) => {
  const minutes = 10 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`;
});

/** Stroke icon paths (24x24 viewBox), picked per service by position. */
const SERVICE_ICONS = [
  'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.1 7.9 20 18M8.1 16.1 20 6',
  'M12 3a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5zM8 14c1 3 2.2 5 4 5s3-2 4-5M9.5 9.5h.01M14.5 9.5h.01',
  'M12 3a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5zM7 8c2 0 4-1 5-3 1 2 3 3 5 3M9.5 12h.01M14.5 12h.01M10 16h4',
  'M18 3 9 12M9 12c-3 0-5 2-5 5 0 2 1 4 4 4 3 0 5-2 5-5M9 12l3 3',
];

const FEATURES = [
  { icon: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 14l2 2 4-4', text: 'Đặt lịch\nnhanh chóng' },
  { icon: SERVICE_ICONS[0], text: 'Barber\nchuyên nghiệp' },
  { icon: 'M6 4h12l3 5-9 11L3 9l3-5zM3 9h18M9 4l3 16M15 4l-3 16', text: 'Phong cách\nchuẩn chất' },
];

@Component({
  selector: 'app-booking',
  imports: [FormsModule, VndPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; background: #0b0b0b; color: #fff; font-family: Manrope, Arial, sans-serif; }
    svg { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
    .bk-page { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 720px); gap: 40px; align-items: center; max-width: 1600px; margin: 0 auto; padding: 16px 4%; min-height: 860px; }
    .bk-photo { position: absolute; inset: 0; background: linear-gradient(90deg, rgb(11 11 11 / 92%) 0%, rgb(11 11 11 / 35%) 45%, rgb(11 11 11 / 25%) 100%), url('/images/nineeleven-hero.png') -26vw 0 / auto 100% no-repeat #0b0b0b; pointer-events: none; }
    .bk-intro { position: relative; z-index: 1; padding: 0 0 0 1vw; }
    .bk-kicker { margin: 0 0 14px; color: #d3262e; font-size: 13px; font-weight: 700; letter-spacing: 3px; }
    h1 { margin: 0 0 22px; font-size: clamp(44px, 5.2vw, 76px); font-weight: 800; line-height: 1.08; letter-spacing: -1px; }
    h1 .light { display: block; font-weight: 400; }
    h1 em { display: block; color: #d3262e; font-style: normal; }
    .bk-lead { max-width: 420px; margin: 0 0 38px; font-size: 18px; line-height: 1.55; color: #f0ece5; }
    .bk-features { display: flex; gap: 44px; margin-bottom: 38px; }
    .bk-features div { text-align: center; font-size: 14px; font-weight: 700; line-height: 1.35; white-space: pre-line; }
    .bk-features svg { display: block; width: 42px; height: 42px; margin: 0 auto 10px; color: #f2a93b; }
    .bk-quick { display: flex; align-items: center; gap: 22px; max-width: 350px; padding: 20px 26px; border-left: 3px solid #d3262e; background: rgb(0 0 0 / 55%); font-size: 15px; line-height: 1.45; }
    .bk-quick svg { flex: none; width: 40px; height: 40px; }

    .bk-card { position: relative; z-index: 1; padding: 26px 30px 28px; border: 1px solid #2a2a2a; border-radius: 18px; background: rgb(16 16 16 / 96%); box-shadow: 0 24px 70px rgb(0 0 0 / 55%); }
    .bk-head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 1px solid #2a2a2a; }
    .bk-head small { display: block; color: #d3262e; font-size: 12px; letter-spacing: 3px; }
    .bk-head h2 { margin: 4px 0 0; font-size: 30px; font-weight: 800; }
    .bk-progress { text-align: right; font-size: 14px; }
    .bk-bars { display: flex; gap: 8px; margin-top: 10px; }
    .bk-bars i { width: 44px; height: 4px; border-radius: 2px; background: #333; }
    .bk-bars i.on { background: #d3262e; }
    .bk-alert { margin-top: 14px; padding: 11px 14px; border-radius: 8px; background: #3a1316; color: #ff9aa0; font-size: 14px; }
    .bk-step { margin-top: 20px; }
    .bk-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0 0 12px; font-size: 16px; font-weight: 800; }
    .bk-title span { display: flex; gap: 14px; align-items: baseline; }
    .bk-title b { font-size: 18px; }

    .bk-services { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
    .bk-service { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 18px 10px 14px; border: 1px solid #333; border-radius: 8px; background: #141414; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; }
    .bk-service:hover { border-color: #5a5a5a; }
    .bk-service input { position: absolute; opacity: 0; pointer-events: none; }
    .bk-service svg.icon { width: 46px; height: 46px; margin-bottom: 8px; padding: 10px; border-radius: 50%; background: #232323; color: #f2a93b; }
    .bk-service b { font-size: 14px; }
    .bk-service small { font-size: 12px; color: #a8a29a; }
    .bk-check { position: absolute; top: 8px; right: 8px; display: none; width: 22px; height: 22px; padding: 4px; border-radius: 50%; background: #d3262e; color: #fff; stroke-width: 2.6; }
    .bk-picked { border-color: #d3262e !important; background: #2a1214 !important; box-shadow: 0 0 0 1px #d3262e inset; }
    .bk-picked .bk-check { display: block; }
    .bk-service:has(input:focus-visible), .bk-barber:has(input:focus-visible) { outline: 2px solid #fff; outline-offset: 2px; }

    .bk-barbers { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
    .bk-barber { position: relative; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid #333; border-radius: 8px; background: #141414; cursor: pointer; transition: border-color .15s, background .15s; }
    .bk-barber:hover { border-color: #5a5a5a; }
    .bk-barber input { position: absolute; opacity: 0; pointer-events: none; }
    .bk-avatar { display: grid; flex: none; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #3a3a3a; font-size: 16px; font-weight: 800; }
    .bk-barber b { display: block; font-size: 14px; }
    .bk-barber small { font-size: 12px; color: #a8a29a; }

    .bk-date { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #d8d3cb; }
    .bk-date svg { width: 20px; height: 20px; }
    .bk-date input { border: 0; outline: 0; background: transparent; color: #fff; font: inherit; color-scheme: dark; cursor: pointer; }
    .bk-slots { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .bk-slot { height: 34px; border: 0; border-radius: 4px; background: #262626; color: #fff; font: inherit; font-size: 14px; cursor: pointer; transition: background .15s; }
    .bk-slot:hover:not(:disabled) { background: #3a3a3a; }
    .bk-slot:disabled { color: #5e5a54; cursor: not-allowed; }
    .bk-slot.bk-on { background: #d3262e; font-weight: 800; }
    .bk-hint { margin: 10px 0 0; font-size: 13px; color: #a8a29a; }

    .bk-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .bk-field label { display: block; margin-bottom: 6px; font-size: 13px; color: #d8d3cb; }
    .bk-field label b { color: #d3262e; }
    .bk-box { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px; border: 1px solid #3a3a3a; border-radius: 6px; background: #0d0d0d; }
    .bk-box:focus-within { border-color: #d3262e; }
    .bk-box svg { flex: none; width: 20px; height: 20px; }
    .bk-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: #fff; font: inherit; font-size: 14px; }
    .bk-box input::placeholder { color: #77726b; }
    .bk-submit { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 50px; margin-top: 6px; border: 0; border-radius: 6px; background: #d3262e; color: #fff; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; transition: background .15s; }
    .bk-submit:hover:not(:disabled) { background: #b81f27; }
    .bk-submit:disabled { opacity: .6; cursor: progress; }
    .bk-submit svg { width: 20px; height: 20px; }
    .bk-note { margin: 12px 0 0; text-align: center; font-size: 12px; color: #8a847b; }

    @media (max-width: 1100px) {
      .bk-page { grid-template-columns: minmax(0, 1fr); padding-top: 32px; }
      .bk-photo { background-position: -40vw 0; }
      .bk-features { gap: 28px; }
    }
    @media (max-width: 560px) {
      .bk-row { grid-template-columns: minmax(0, 1fr); }
      .bk-card { padding: 20px 16px; }
      .bk-photo { background-position: -60vw 0; }
    }
  `,
  template: `
    <section class="bk-page">
      <div class="bk-photo" aria-hidden="true"></div>
      <div class="bk-intro">
        <p class="bk-kicker">NINEELEVEN BARBER</p>
        <h1>ĐẶT LỊCH<br />CẮT TÓC<span class="light">TRẢI NGHIỆM</span><em>ĐẲNG CẤP.</em></h1>
        <p class="bk-lead">Chọn dịch vụ, thời gian phù hợp và để NineEleven chăm sóc phong cách của bạn.</p>
        <div class="bk-features">
          @for (f of features; track f.text) {
            <div><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="f.icon" /></svg>{{ f.text }}</div>
          }
        </div>
        <div class="bk-quick">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span>Chỉ mất khoảng 60 giây<br />để giữ ghế của bạn.</span>
        </div>
      </div>

      <form class="bk-card" (submit)="submit($event)">
        <div class="bk-head">
          <div><small>BOOKING</small><h2>ĐẶT LỊCH NGAY</h2></div>
          <div class="bk-progress">
            Bước {{ step() }}/3
            <div class="bk-bars" aria-hidden="true">
              <i [class.on]="step() >= 1"></i><i [class.on]="step() >= 2"></i><i [class.on]="step() >= 3"></i>
            </div>
          </div>
        </div>
        @if (error()) { <div class="bk-alert" role="alert">{{ error() }}</div> }

        <div class="bk-step">
          <p class="bk-title"><span><b>01</b> CHỌN DỊCH VỤ</span></p>
          <div class="bk-services">
            @for (s of services(); track s.id; let i = $index) {
              <label class="bk-service" [class.bk-picked]="serviceId() === s.id">
                <input type="radio" name="service" [value]="s.id" [ngModel]="serviceId()" (ngModelChange)="serviceId.set($event)" required />
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="icons[i % icons.length]" /></svg>
                <b>{{ s.name }}</b>
                <small>{{ s.duration }} phút · {{ s.price | vnd }}đ</small>
                <svg class="bk-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
              </label>
            }
          </div>
        </div>

        <div class="bk-step">
          <p class="bk-title"><span><b>02</b> CHỌN BARBER</span></p>
          <div class="bk-barbers">
            @for (b of barbers(); track b.id) {
              <label class="bk-barber" [class.bk-picked]="barberId() === b.id">
                <input type="radio" name="barber" [value]="b.id" [ngModel]="barberId()" (ngModelChange)="barberId.set($event)" required />
                <span class="bk-avatar" aria-hidden="true">{{ b.name.charAt(0) }}</span>
                <span><b>{{ b.name }}</b><small>{{ b.title }}</small></span>
                <svg class="bk-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
              </label>
            }
          </div>
        </div>

        <div class="bk-step">
          <p class="bk-title">
            <span><b>03</b> CHỌN KHUNG GIỜ</span>
            <label class="bk-date">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></svg>
              Ngày:
              <input type="date" name="date" aria-label="Chọn ngày" [min]="today" [ngModel]="date()" (ngModelChange)="date.set($event)" required />
            </label>
          </p>
          <div class="bk-slots" role="group" aria-label="Khung giờ">
            @for (slot of grid(); track slot.label) {
              <button type="button" class="bk-slot" [class.bk-on]="!!slot.value && startsAt() === slot.value" [attr.aria-pressed]="!!slot.value && startsAt() === slot.value" [disabled]="!slot.value" (click)="startsAt.set(slot.value)">{{ slot.label }}</button>
            }
          </div>
          <p class="bk-hint">{{ slotStatus() }}</p>
        </div>

        <div class="bk-step">
          <p class="bk-title"><span><b>04</b> THÔNG TIN LIÊN HỆ</span></p>
          <div class="bk-row">
            <div class="bk-field">
              <label for="name">Họ tên <b>*</b></label>
              <div class="bk-box">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
                <input id="name" name="name" [(ngModel)]="name" placeholder="Nhập họ tên của bạn" maxlength="100" autocomplete="name" required />
              </div>
            </div>
            <div class="bk-field">
              <label for="phone">Số điện thoại <b>*</b></label>
              <div class="bk-box">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>
                <input id="phone" name="phone" [(ngModel)]="phone" placeholder="Nhập số điện thoại" autocomplete="tel" required />
              </div>
            </div>
          </div>
          <div class="bk-row">
            <div class="bk-field">
              <label for="email">Email (không bắt buộc)</label>
              <div class="bk-box">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3 7l9 6 9-6" /></svg>
                <input id="email" type="email" name="email" [(ngModel)]="email" placeholder="you@email.com" autocomplete="email" />
              </div>
            </div>
            <div class="bk-field">
              <label for="notes">Ghi chú</label>
              <div class="bk-box">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 9h8M8 13h6" /></svg>
                <input id="notes" name="notes" [(ngModel)]="notes" placeholder="Kiểu tóc, yêu cầu đặc biệt..." maxlength="500" />
              </div>
            </div>
          </div>
        </div>

        <button class="bk-submit" type="submit" [disabled]="busy()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 3 11l7 3 3 7 8-18zM10 14l11-11" /></svg>
          ĐẶT LỊCH NGAY
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <p class="bk-note">Bằng việc đặt lịch, bạn đồng ý để NineEleven liên hệ xác nhận qua điện thoại.</p>
      </form>
    </section>
  `,
})
export class Booking {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly icons = SERVICE_ICONS;
  protected readonly features = FEATURES;
  protected readonly services = toSignal(this.api.services(), { initialValue: [] });
  protected readonly barbers = toSignal(this.api.barbers(), { initialValue: [] });
  protected readonly today = salonToday();

  protected readonly serviceId = signal(this.route.snapshot.queryParamMap.get('service') ?? '');
  protected readonly barberId = signal('');
  protected readonly date = signal('');
  protected readonly startsAt = signal('');
  protected readonly slots = signal<Slot[]>([]);
  protected readonly slotStatus = signal('Chọn dịch vụ, barber và ngày để xem giờ trống.');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  /** The full 10:00 – 19:30 grid; a cell is enabled only when the server reports that start time as free. */
  protected readonly grid = computed(() => {
    const free = new Map(this.slots().map((slot) => [slot.label, slot.value]));
    return SLOT_LABELS.map((label) => ({ label, value: free.get(label) ?? '' }));
  });

  /** 1 = pick service and barber, 2 = pick day and time, 3 = enter contact details. */
  protected readonly step = computed(() => {
    if (!this.serviceId() || !this.barberId()) {
      return 1;
    }
    return this.startsAt() ? 3 : 2;
  });

  protected name = '';
  protected phone = '';
  protected email = '';
  protected notes = '';

  /** Bumped after a failed submit so the available slots are fetched again. */
  private readonly refresh = signal(0);

  private readonly slotQuery = computed(() => ({
    serviceId: this.serviceId(),
    barberId: this.barberId(),
    date: this.date(),
    refresh: this.refresh(),
  }));

  constructor() {
    effect((onCleanup) => {
      const { serviceId, barberId, date } = this.slotQuery();
      untracked(() => {
        this.startsAt.set('');
        this.slots.set([]);
      });
      if (!serviceId || !barberId || !date) {
        this.slotStatus.set('Chọn dịch vụ, barber và ngày để xem giờ trống.');
        return;
      }
      this.slotStatus.set('Đang cập nhật...');
      const sub = this.api
        .slots(date, serviceId, barberId)
        .pipe(catchError(() => of(null)))
        .subscribe((slots) => {
          if (!slots) {
            this.slotStatus.set('Không thể tải lịch, hãy thử lại.');
            return;
          }
          this.slots.set(slots);
          this.slotStatus.set(slots.length ? `${slots.length} khung giờ còn trống.` : 'Đã kín lịch ngày này.');
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.serviceId() || !this.barberId() || !this.startsAt()) {
      this.error.set('Vui lòng chọn dịch vụ, barber, ngày và khung giờ.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api
      .createBooking({
        name: this.name,
        phone: this.phone,
        email: this.email || undefined,
        notes: this.notes || undefined,
        serviceId: this.serviceId(),
        barberId: this.barberId(),
        startsAt: this.startsAt(),
      })
      .subscribe({
        next: ({ code }) => this.router.navigate(['/dat-lich/thanh-cong', code]),
        error: (e) => {
          this.error.set(apiMessage(e));
          this.busy.set(false);
          this.refresh.update((n) => n + 1);
        },
      });
  }
}
