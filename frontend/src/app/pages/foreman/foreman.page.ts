import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-foreman-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './foreman.page.html',
  styleUrls: ['./foreman.page.css'],
})
export class ForemanPage implements OnDestroy {
  // онлайн/оффлайн
  online = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  private onl = () => this.online.set(true);
  private ofl = () => this.online.set(false);

  constructor(private router: Router) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onl);
      window.addEventListener('offline', this.ofl);
    }
  }
  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onl);
      window.removeEventListener('offline', this.ofl);
    }
  }

  // меню слева
  section: 'objects' | 'schedule' | 'notes' | 'checks' | 'dicts' = 'objects';
  goSection(s: typeof this.section) {
    this.section = s;
  }

  // выход
  logout() {
    this.router.navigateByUrl('/auth/login');
  }
}
