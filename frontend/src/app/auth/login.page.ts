import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  // для подсветки ошибки под логином (см. макет)
  loginError: string | null = null;

  constructor(private router: Router) {}

  onSubmit() {
    const who = this.login.trim().toLowerCase();

    if (['админ', 'admin', 'адмін'].includes(who)) {
      this.router.navigateByUrl('/admin/users');
      return;
    }

    // задел под будущие роли (когда подключим страницы):
    if (who === 'прораб') {
      this.router.navigateByUrl('/foreman'); // будет страница прораба
      return;
    }
    if (who === 'инспектор') {
      this.router.navigateByUrl('/inspector'); // будет страница инспектора
      return;
    }
    if (who === 'клиент' || who === 'заказчик') {
      this.router.navigateByUrl('/customer'); // будет страница заказчика
      return;
    }

    // иначе — показываем ошибку под инпутом
    this.loginError = 'Такого логина не существует';
  }
}
