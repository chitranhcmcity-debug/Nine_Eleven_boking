import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { apiMessage } from '../../core/format';
import { StyleLoader } from '../../core/style-loader';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="login-card" (submit)="submit($event)">
      <div class="login-brand">9/<span>11</span></div>
      <p>NINEELEVEN STUDIO · CRM</p>
      <h1>Chào mừng trở lại.</h1>
      @if (error()) { <div class="notice error">{{ error() }}</div> }
      <label for="email">Email</label>
      <input id="email" type="email" name="email" [(ngModel)]="email" required />
      <label for="password">Mật khẩu</label>
      <input id="password" type="password" name="password" [(ngModel)]="password" required />
      <button [disabled]="busy()">ĐĂNG NHẬP →</button>
      <small>Tài khoản demo: admin&#64;nineeleven.vn / nineeleven</small>
    </form>
  `,
})
export class AdminLogin {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  protected email = 'admin@nineeleven.vn';
  protected password = '';
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  constructor() {
    const detach = inject(StyleLoader).attach(
      ['https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap', 'css/admin.css'],
      'login-page',
    );
    inject(DestroyRef).onDestroy(detach);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password, false).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (e) => {
        this.error.set(apiMessage(e));
        this.busy.set(false);
      },
    });
  }
}
