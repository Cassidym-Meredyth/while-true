import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.css'],
})
export class AdminShellComponent {
  url = signal<string>('/');
  section = computed(() => {
    const u = this.url();
    if (u.includes('/admin/dicts')) return 'dicts';
    if (u.includes('/admin/users')) return 'users';
    return '';
  });

  constructor(private router: Router) {
    this.url.set(this.router.url);
    this.router.events.subscribe(() => this.url.set(this.router.url));
  }

  go(to: 'users' | 'dicts') {
    this.router.navigate(['/admin', to]);
  }

  // ← Кнопка "Выход"
  logout() {
    this.router.navigateByUrl('/auth/login');
  }
}
