import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['./auth.styles.css'],
})
export class LoginPage {
  login = '';
  password = '';
  remember = false;
  loginError: string | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  onSubmit() {
    this.auth.login({ login: this.login, password: this.password }).subscribe({
      next: (user) => {
        const byRole: Record<string, string> = {
          admin: '/admin/users',
          customer: '/customer',
          foreman: '/foreman',
          inspector: '/inspector',
        };
        this.router.navigateByUrl(byRole[user.role] ?? '/auth/login');
      },
      error: () => {
        const who = this.login.trim().toLowerCase();
        const routeByLogin: Record<string, string> = {
          // admin
          admin: '/admin/users',
          админ: '/admin/users',
          адмін: '/admin/users',
          // customer
          customer: '/customer',
          client: '/customer',
          клиент: '/customer',
          заказчик: '/customer',
          // foreman
          foreman: '/foreman',
          прораб: '/foreman',
          // inspector
          inspector: '/inspector',
          инспектор: '/inspector',
        };
        const target = routeByLogin[who];
        if (target) {
          this.router.navigateByUrl(target);
        } else {
          this.loginError = 'Такого логина не существует';
        }
      },
    });
  }
}
