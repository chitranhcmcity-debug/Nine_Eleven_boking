import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api';
import { apiMessage } from '../../core/format';

@Component({
  selector: 'app-inquiry',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-heading"><p>NINEELEVEN BARBER STUDIO</p><h1>{{ academy() ? 'HỌC BARBER' : 'HỎI BARBER' }}</h1></div>
    <section class="content-section inquiry-layout">
      <div>
        <img src="images/4rau/branch-3.webp" alt="Không gian barber" />
        <h2>{{ academy() ? 'BẮT ĐẦU HÀNH TRÌNH BARBER.' : 'TÓC CỦA BẠN. CÂU HỎI CỦA BẠN.' }}</h2>
        <p>
          {{
            academy()
              ? 'Tìm hiểu lộ trình từ kỹ thuật cắt cơ bản, fade đến tạo kiểu và tư vấn khách hàng. Để lại thông tin để nhận tư vấn khóa học.'
              : 'Bạn cần chọn kiểu tóc, sản phẩm hay chăm sóc tóc tại nhà? Gửi câu hỏi để đội ngũ liên hệ tư vấn.'
          }}
        </p>
        <p>Thông tin học phí và lịch khai giảng được tư vấn theo từng khóa.</p>
      </div>
      <form class="checkout-box" (submit)="submit($event)">
        <h2>ĐỂ LẠI LỜI NHẮN</h2>
        @if (error()) { <div class="flash-message error" role="alert">{{ error() }}</div> }
        @if (done()) { <div class="flash-message" role="status">{{ done() }}</div> }
        <label>Họ tên<input name="name" [(ngModel)]="name" required maxlength="100" /></label>
        <label>Số điện thoại<input name="phone" [(ngModel)]="phone" required /></label>
        <label>Email<input name="email" type="email" [(ngModel)]="email" /></label>
        <label>Nội dung<textarea name="message" rows="6" maxlength="2000" [(ngModel)]="message" required></textarea></label>
        <button class="button" [disabled]="busy()">GỬI YÊU CẦU →</button>
      </form>
    </section>
  `,
})
export class Inquiry {
  /** Route data: "academy" or "consultation". */
  readonly kind = input<string>('consultation');
  private readonly api = inject(Api);
  protected readonly error = signal('');
  protected readonly done = signal('');
  protected readonly busy = signal(false);
  protected name = '';
  protected phone = '';
  protected email = '';
  protected message = '';

  protected academy(): boolean {
    return this.kind() === 'academy';
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    this.done.set('');
    this.api
      .createInquiry({
        kind: this.kind(),
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
