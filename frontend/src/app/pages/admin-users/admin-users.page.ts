import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type UserRow = {
  id: number;
  fio: string;
  role: 'Админ' | 'Инспектор' | 'Прораб' | 'Заказчик';
  phone: string;
  status: 'Активен' | 'Заблокирован';
  last: string;
};

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.css'],
})
export class AdminUsersPageComponent {
  // состояние правой панели
  panelOpen = false;

  // данные таблицы (пример)
  rows: UserRow[] = [
    {
      id: 1,
      fio: 'Фамилия И.О.',
      role: 'Заказчик',
      phone: '449-110-13',
      status: 'Активен',
      last: '17 мая',
    },
    {
      id: 2,
      fio: 'Фамилия И.О.',
      role: 'Прораб',
      phone: '123-456-78',
      status: 'Активен',
      last: '25 августа',
    },
    {
      id: 3,
      fio: 'Фамилия И.О.',
      role: 'Инспектор',
      phone: '111-155-457',
      status: 'Активен',
      last: '1 декабря',
    },
    {
      id: 4,
      fio: 'Фамилия И.О.',
      role: 'Админ',
      phone: '993-123-12',
      status: 'Заблокирован',
      last: '23 января',
    },
  ];

  // кнопки панели
  openPanel(): void {
    this.panelOpen = true;
  }
  closePanel(): void {
    this.panelOpen = false;
  }

  // CSS-класс «плашки» роли
  roleClass(role: UserRow['role']): string {
    switch (role) {
      case 'Админ':
        return 'chip chip--blue';
      case 'Инспектор':
        return 'chip chip--indigo';
      case 'Прораб':
        return 'chip chip--yellow';
      case 'Заказчик':
        return 'chip chip--green';
      default:
        return 'chip';
    }
  }

  // CSS-класс статуса
  statusClass(status: UserRow['status']): string {
    return status === 'Активен' ? 'badge green' : 'badge red';
  }

  // trackBy
  trackById(_: number, r: UserRow) {
    return r.id;
  }
}
