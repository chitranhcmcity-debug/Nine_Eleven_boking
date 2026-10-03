import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Auth } from '../core/auth';
import { StyleLoader } from '../core/style-loader';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside>
      <a routerLink="/admin" class="admin-logo">9/<span>11</span><small>STUDIO CRM</small></a>
      <nav>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">⌂ Tổng quan</a>
        <a routerLink="/admin/lich-hen" routerLinkActive="active">◫ Lịch hẹn</a>
        <a routerLink="/admin/khach-hang" routerLinkActive="active">◎ Khách hàng</a>
        <a routerLink="/" target="_blank">↗ Xem website</a>
      </nav>
      <button (click)="logout()">Đăng xuất</button>
    </aside>
    <main class="admin-main">
      <header>
        <div><small>NINEELEVEN / CRM</small><h1>{{ heading() }}</h1></div>
        <div class="admin-user">
          <span>{{ auth.user()?.name }}</span><b>{{ auth.user()?.name?.charAt(0)?.toUpperCase() }}</b>
        </div>
      </header>
      <router-outlet />
    </main>
  `,
})
export class AdminLayout {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly heading = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let current = this.route;
        while (current.firstChild) {
          current = current.firstChild;
        }
        return (current.snapshot?.data?.['heading'] as string) ?? '';
      }),
    ),
    { initialValue: '' },
  );

  constructor() {
    const detach = inject(StyleLoader).attach(
      ['https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap', 'css/admin.css'],
    );
    inject(DestroyRef).onDestroy(detach);
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/admin/login'));
  }
}
