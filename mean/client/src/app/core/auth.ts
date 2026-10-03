import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';

export interface AdminUser {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  readonly user = signal<AdminUser | null>(null);

  /** Resolves the current session from the server cookie. */
  restore() {
    return this.http.get<{ user: AdminUser }>('/api/admin/me').pipe(
      tap(({ user }) => this.user.set(user)),
      map(() => true),
      catchError(() => {
        this.user.set(null);
        return of(false);
      }),
    );
  }

  login(email: string, password: string, remember: boolean) {
    return this.http
      .post<{ user: AdminUser }>('/api/admin/login', { email, password, remember })
      .pipe(tap(({ user }) => this.user.set(user)));
  }

  logout() {
    return this.http.post<void>('/api/admin/logout', {}).pipe(tap(() => this.user.set(null)));
  }
}

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.user()) {
    return true;
  }
  return auth.restore().pipe(map((ok) => ok || router.createUrlTree(['/admin/login'])));
};
