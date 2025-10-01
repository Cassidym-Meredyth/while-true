import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AdminUserRow {
  id: string;
  fio: string;
  role: 'admin' | 'foreman' | 'inspector' | 'customer';
  phone?: string;
  status: 'active' | 'blocked';
  lastLogin?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  constructor(private api: ApiService) {}

  listUsers(): Observable<AdminUserRow[]> {
    return this.api.get<AdminUserRow[]>('/admin/users');
  }

  createUser(
    payload: Partial<AdminUserRow> & { password: string }
  ): Observable<AdminUserRow> {
    return this.api.post<AdminUserRow>('/admin/users', payload);
  }

  blockUser(id: string): Observable<void> {
    return this.api.post<void>(`/admin/users/${id}/block`, {});
  }
}
