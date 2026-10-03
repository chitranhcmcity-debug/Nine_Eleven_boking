import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

const POLICIES: Record<string, { title: string; body: string }> = {
  'giao-hang': {
    title: 'Giao hàng & thanh toán',
    body: 'Phí giao hàng 30.000 ₫, miễn phí cho đơn từ 1.000.000 ₫. Thanh toán khi nhận hàng (COD).',
  },
  'doi-tra': {
    title: 'Đổi trả sản phẩm',
    body: 'Vui lòng liên hệ cửa hàng để được hỗ trợ đổi trả đối với sản phẩm lỗi hoặc giao sai.',
  },
  'bao-mat': {
    title: 'Chính sách bảo mật',
    body: 'Thông tin họ tên, số điện thoại và địa chỉ chỉ được dùng để xác nhận lịch hẹn và giao hàng.',
  },
};

@Component({
  selector: 'app-policy',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="reading">
      <p class="overline">THÔNG TIN HỖ TRỢ</p>
      <h1>{{ policy().title }}</h1>
      <div class="article-body">{{ policy().body }}</div>
      <p><a routerLink="/tu-van">Liên hệ hỗ trợ →</a></p>
    </article>
  `,
})
export class Policy {
  /** Bound from the :slug route parameter. */
  readonly slug = input.required<string>();
  protected readonly policy = computed(
    () => POLICIES[this.slug()] ?? { title: 'Không tìm thấy trang', body: 'Trang bạn tìm không tồn tại.' },
  );
}
