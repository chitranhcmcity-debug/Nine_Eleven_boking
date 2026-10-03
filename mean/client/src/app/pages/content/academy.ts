import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api';
import { apiMessage } from '../../core/format';

const HIGHLIGHTS = [
  { icon: 'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.1 7.9 20 18M8.1 16.1 20 6', text: 'Giáo trình\nthực tế' },
  { icon: 'M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21c0-4 3-6 7-6 1.5 0 2.800.3 3.800.9M17 16a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5zM19 20l2 2', text: 'Giảng viên\nkinh nghiệm' },
  { icon: 'M2 9l10-5 10 5-10 5L2 9zM6 11.500V16c0 1.500 3 3 6 3s6-1.500 6-3v-4.500M22 9v6', text: 'Thực hành\n80% thời lượng' },
  { icon: 'M12 2l2.500 2 3.200-.3.800 3.100 2.700 1.800-1.200 3 1.200 3-2.700 1.800-.8 3.100-3.200-.3L12 22l-2.500-2-3.200.3-.8-3.100L2.800 15.400 4 12.400l-1.200-3 2.700-1.800.8-3.100 3.200.3L12 2zM9 12l2 2 4-4', text: 'Hỗ trợ\nviệc làm' },
];

const COURSES = [
  { n: '01', title: 'HỌC TỪ CƠ BẢN', text: 'Nền tảng vững chắc\ncho người mới bắt đầu.', pos: '60% 25%' },
  { n: '02', title: 'KỸ THUẬT CHUYÊN SÂU', text: 'Fade, texture, tạo kiểu,\nxử lý mọi chất tóc.', pos: '75% 40%' },
  { n: '03', title: 'THỰC HÀNH LIÊN TỤC', text: 'Lên mẫu thật, rèn tay nghề\ntại tiệm.', pos: '82% 20%' },
  { n: '04', title: 'HỖ TRỢ SAU KHÓA HỌC', text: 'Kết nối việc làm,\nđồng hành lâu dài.', pos: '15% 60%' },
];

@Component({
  selector: 'app-academy',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; background: #f4f1ec; }
    svg { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
    .ac-page { position: relative; padding-bottom: 56px; }
    .ac-bg { position: absolute; inset: 0 0 auto 0; height: 535px; background: linear-gradient(90deg, #0b0b0b 0%, rgb(11 11 11 / 88%) 30%, rgb(11 11 11 / 10%) 68%), url('/images/nineeleven-hero.png') 70% 25% / cover no-repeat #0b0b0b; }
    .ac-grid { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 470px); gap: 0 48px; max-width: 1500px; margin: 0 auto; padding: 0 4%; }
    .ac-hero { min-height: 535px; padding-top: 66px; color: #fff; }
    .ac-kicker { display: flex; align-items: center; gap: 14px; margin: 0 0 22px; font-size: 13px; letter-spacing: 4px; color: #e9e5de; }
    .ac-kicker::before { content: ''; width: 3px; height: 22px; background: #c1272d; }
    h1 { margin: 0 0 20px; font: 800 clamp(34px, 4.2vw, 62px)/1.12 Manrope, Arial, sans-serif; letter-spacing: -.5px; }
    h1 em { display: block; color: #d3262e; font-style: normal; }
    .ac-lead { max-width: 560px; margin: 0 0 28px; font-size: 18px; line-height: 1.6; color: #f0ece5; }
    .ac-points { display: flex; flex-wrap: wrap; gap: 28px 44px; margin-bottom: 32px; }
    .ac-points div { font-size: 14px; line-height: 1.45; white-space: pre-line; }
    .ac-points svg { display: block; width: 40px; height: 40px; margin-bottom: 10px; }
    .ac-cta { display: inline-flex; align-items: center; gap: 12px; height: 60px; padding: 0 34px; border-radius: 6px; background: #c1272d; color: #fff; font-size: 15px; font-weight: 800; letter-spacing: .5px; text-decoration: none; transition: background .15s; }
    .ac-cta:hover { background: #a81f25; }
    .ac-cta svg { width: 20px; height: 20px; }

    .ac-card { position: relative; margin-top: 105px; align-self: start; padding: 32px 30px 28px; border-radius: 14px; background: #fff; box-shadow: 0 24px 60px rgb(0 0 0 / 22%); }
    .ac-card h2 { margin: 0 0 10px; font: 800 30px/1.1 Manrope, Arial, sans-serif; color: #161616; }
    .ac-card p.sub { margin: 0 0 22px; font-size: 15px; color: #4b463f; }
    .ac-msg { margin-bottom: 14px; padding: 11px 14px; border-radius: 8px; font-size: 14px; }
    .ac-msg.ok { background: #e8f5ec; color: #1d6b37; }
    .ac-msg.err { background: #fdecec; color: #b3202a; }
    .ac-box { display: flex; gap: 12px; margin-bottom: 14px; padding: 0 16px; border: 1px solid #e3ded6; border-radius: 6px; background: #fff; align-items: center; }
    .ac-box:focus-within { border-color: #c1272d; }
    .ac-box.area { align-items: flex-start; padding-top: 16px; }
    .ac-box svg { flex: none; width: 22px; height: 22px; color: #4b463f; }
    .ac-box input, .ac-box textarea { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: inherit; font-size: 15px; color: #161616; }
    .ac-box input { height: 50px; }
    .ac-box textarea { min-height: 92px; padding: 0 0 14px; resize: vertical; margin-top: -3px; }
    .ac-box input::placeholder, .ac-box textarea::placeholder { color: #9a948a; }
    .ac-send { font-family: Manrope, Arial, sans-serif; display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 56px; border: 0; border-radius: 6px; background: #c1272d; color: #fff; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; transition: background .15s; }
    .ac-send:hover:not(:disabled) { background: #a81f25; }
    .ac-send:disabled { opacity: .6; cursor: progress; }
    .ac-send svg { width: 22px; height: 22px; }
    .ac-secure { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 16px 0 0; font-size: 13px; color: #6b665e; }
    .ac-secure svg { width: 15px; height: 15px; }

    .ac-courses { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; margin-top: 20px; }
    .ac-course { position: relative; display: flex; flex-direction: column; justify-content: flex-end; min-height: 178px; padding: 18px 20px; border-radius: 10px; overflow: hidden; color: #fff; background: linear-gradient(180deg, rgb(0 0 0 / 15%) 0%, rgb(0 0 0 / 85%) 100%), url('/images/nineeleven-hero.png') var(--pos) / 260% auto no-repeat #111; }
    .ac-course b { display: block; margin-bottom: 4px; font-size: 20px; }
    .ac-course strong, .ac-cta { font-family: Manrope, Arial, sans-serif; }
    .ac-course b::after { content: ''; display: block; width: 26px; height: 2px; margin: 6px 0 12px; background: #fff; }
    .ac-course strong { display: block; margin-bottom: 6px; font-size: 17px; line-height: 1.2; }
    .ac-course span { font-size: 14px; line-height: 1.45; white-space: pre-line; color: #e7e2da; }

    @media (max-width: 1100px) {
      .ac-grid { grid-template-columns: minmax(0, 1fr); }
      .ac-bg { height: 640px; }
      .ac-card { margin-top: 28px; }
      .ac-courses { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .ac-hero { padding-top: 40px; }
      .ac-points { gap: 22px 28px; }
      .ac-courses { grid-template-columns: minmax(0, 1fr); }
    }
  `,
  template: `
    <section class="ac-page">
      <div class="ac-bg" aria-hidden="true"></div>
      <div class="ac-grid">
        <div>
          <div class="ac-hero">
            <p class="ac-kicker">NINEELEVEN BARBER ACADEMY</p>
            <h1>BẮT ĐẦU HÀNH TRÌNH<em>BARBER.</em></h1>
            <p class="ac-lead">Từ đam mê đến nghề nghiệp. NineEleven đồng hành cùng bạn trên con đường trở thành barber chuyên nghiệp.</p>
            <div class="ac-points">
              @for (p of points; track p.text) {
                <div><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="p.icon" /></svg>{{ p.text }}</div>
              }
            </div>
            <a class="ac-cta" href="#dang-ky" (click)="focusForm($event)">
              ĐĂNG KÝ NGAY
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
          <div class="ac-courses">
            @for (c of courses; track c.n) {
              <article class="ac-course" [style.--pos]="c.pos">
                <b>{{ c.n }}</b>
                <strong>{{ c.title }}</strong>
                <span>{{ c.text }}</span>
              </article>
            }
          </div>
        </div>

        <form class="ac-card" id="dang-ky" (submit)="submit($event)">
          <h2>ĐỂ LẠI LỜI NHẮN</h2>
          <p class="sub">Chúng tôi sẽ liên hệ tư vấn khóa học phù hợp cho bạn.</p>
          @if (error()) { <div class="ac-msg err" role="alert">{{ error() }}</div> }
          @if (done()) { <div class="ac-msg ok" role="status">{{ done() }}</div> }
          <label class="ac-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.600-6 8-6s8 2 8 6" /></svg>
            <input name="name" [(ngModel)]="name" placeholder="Họ tên *" maxlength="100" autocomplete="name" aria-label="Họ tên" required />
          </label>
          <label class="ac-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>
            <input name="phone" [(ngModel)]="phone" placeholder="Số điện thoại *" autocomplete="tel" aria-label="Số điện thoại" required />
          </label>
          <label class="ac-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3 7l9 6 9-6" /></svg>
            <input name="email" type="email" [(ngModel)]="email" placeholder="Email" autocomplete="email" aria-label="Email" />
          </label>
          <label class="ac-box area">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1zM8 10h8M8 13h5" /></svg>
            <textarea name="message" [(ngModel)]="message" placeholder="Nội dung (Bạn muốn tìm hiểu khóa học nào?)" maxlength="2000" aria-label="Nội dung" required></textarea>
          </label>
          <button class="ac-send" [disabled]="busy()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 3 11l7 3 3 7 8-18zM10 14l11-11" /></svg>
            GỬI THÔNG TIN
          </button>
          <p class="ac-secure">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Thông tin của bạn được bảo mật tuyệt đối.
          </p>
        </form>
      </div>
    </section>
  `,
})
export class Academy {
  private readonly api = inject(Api);
  protected readonly points = HIGHLIGHTS;
  protected readonly courses = COURSES;
  protected readonly error = signal('');
  protected readonly done = signal('');
  protected readonly busy = signal(false);
  protected name = '';
  protected phone = '';
  protected email = '';
  protected message = '';

  protected focusForm(event: Event): void {
    event.preventDefault();
    const form = document.getElementById('dang-ky');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    this.done.set('');
    this.api
      .createInquiry({
        kind: 'academy',
        name: this.name,
        phone: this.phone,
        email: this.email || undefined,
        message: this.message,
      })
      .subscribe({
        next: (res) => {
          this.done.set(res.message);
          this.name = this.phone = this.email = this.message = '';
          this.busy.set(false);
        },
        error: (e) => {
          this.error.set(apiMessage(e));
          this.busy.set(false);
        },
      });
  }
}
