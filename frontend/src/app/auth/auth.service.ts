import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from '../core/api.service';

export type AppRole = 'admin' | 'foreman' | 'inspector' | 'customer';

export interface AuthUser {
  id: string;
  login: string;
  role: AppRole;
  name?: string;
}

export interface LoginDto {
  login: string;
  password: string;
}
export interface RegisterDto {
  email?: string;
  phone?: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this._user$.asObservable();

  constructor(private api: ApiService) {
    // восстанавливаем пользователя из localStorage
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      try {
        this._user$.next(JSON.parse(raw));
      } catch {}
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /** Роль текущего пользователя */
  role(): AppRole | null {
    return this._user$.value?.role ?? null;
  }

  /** Логин на бэк: POST /auth/login -> {accessToken, user} */
  login(dto: LoginDto): Observable<AuthUser> {
    return this.api.post<LoginResponse>('/auth/login', dto).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
      }),
      map((res) => res.user),
      tap((user) => this._user$.next(user))
    );
  }

  /** Регистрация: POST /auth/register -> {accessToken, user} (или как в твоём бэке) */
  register(dto: RegisterDto): Observable<AuthUser> {
    return this.api.post<LoginResponse>('/auth/register', dto).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
      }),
      map((res) => res.user),
      tap((user) => this._user$.next(user))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    this._user$.next(null);
  }
}
