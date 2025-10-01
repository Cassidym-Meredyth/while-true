import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.page.html',
  styleUrls: ['./auth.styles.css'],
})
export class RegisterPage {
  email = '';
  phone = '';
  username = '';
  password = '';
  confirm = '';
  remember = false;

  emailError: string | null = null;
  phoneError: string | null = null;
  usernameError: string | null = null;

  triggerEmailError() {
    this.emailError = 'Такой почты не существует';
  }
  triggerPhoneError() {
    this.phoneError = 'Такого номера не существует';
  }
  triggerLoginError() {
    this.usernameError = 'Такого логина не существует';
  }
}
