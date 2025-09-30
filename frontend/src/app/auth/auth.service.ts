import { Injectable, signal } from '@angular/core';

export type User = {
  email: string;
  phone?: string;
  username: string;
  password: string;
};

const LS_KEY = 'demo_users';
const TOKEN_KEY = 'demo_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // кто сейчас залогинен (для UI)
  currentUser = signal<User | null>(null);

  constructor() {
    const token = localStorage.getItem(TOKEN_KEY);
    const users = this._users();
    if (token) {
      const u = users.find(
        (x) => x.username === token || x.email === token || x.phone === token
      );
      if (u) this.currentUser.set(u);
    }
  }

  /** Регистрация с простейшими проверками и хранением в localStorage */
  register(user: User) {
    const users = this._users();
    if (users.some((u) => u.email === user.email))
      throw new Error('email-exists');
    if (user.phone && users.some((u) => u.phone === user.phone))
      throw new Error('phone-exists');
    if (users.some((u) => u.username === user.username))
      throw new Error('username-exists');

    users.push(user);
    localStorage.setItem(LS_KEY, JSON.stringify(users));
    return true;
  }

  /** Логин по логину или email/телефону */
  login(login: string, password: string) {
    const users = this._users();
    const u = users.find(
      (x) =>
        (x.username === login || x.email === login || x.phone === login) &&
        x.password === password
    );
    if (!u) throw new Error('bad-credentials');
    localStorage.setItem(TOKEN_KEY, u.username);
    this.currentUser.set(u);
    return true;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
  }

  // ==== helpers ====
  private _users(): User[] {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
      return [];
    }
  }
}
