import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi, AdminUserRow } from '../../core/admin.api';

@Component({
  standalone: true,
  selector: 'app-admin-users-page',
  imports: [CommonModule],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.css'],
})
export class AdminUsersPage implements OnInit {
  panelOpen = false;
  contact: 'phone' | 'email' = 'phone';

  // данные из бэка
  rows: AdminUserRow[] = [];
  loading = false;
  loadError: string | null = null;

  constructor(private adminApi: AdminApi) {}

  ngOnInit(): void {
    this.refresh();
  }

  /** Подтянуть список пользователей с бэка */
  refresh(): void {
    this.loading = true;
    this.loadError = null;

    this.adminApi.listUsers().subscribe({
      next: (data) => (this.rows = data || []),
      error: (err) => {
        console.error('listUsers error', err);
        this.loadError = 'Не удалось загрузить пользователей';
        this.rows = [];
      },
      complete: () => (this.loading = false),
    });
  }

  openPanel() {
    this.panelOpen = true;
  }
  closePanel() {
    this.panelOpen = false;
  }
  setContact(v: 'phone' | 'email') {
    this.contact = v;
  }

  /** Пример создания пользователя */
  createUser(payload: Partial<AdminUserRow> & { password: string }) {
    this.adminApi.createUser(payload).subscribe({
      next: (u) => {
        this.rows = [u, ...this.rows];
        this.closePanel();
      },
      error: (err) => console.error('createUser error', err),
    });
  }

  /** Пример блокировки пользователя */
  blockUser(id: string) {
    this.adminApi.blockUser(id).subscribe({
      next: () =>
        (this.rows = this.rows.map((r) =>
          r.id === id ? { ...r, status: 'blocked' } : r
        )),
      error: (err) => console.error('blockUser error', err),
    });
  }
}
