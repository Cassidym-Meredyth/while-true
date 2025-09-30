import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-offline-banner',
  imports: [CommonModule],
  template: `
    <div *ngIf="!online()" class="offline-banner">
      Вы офлайн. Некоторые функции недоступны.
    </div>
  `,
  styles: [
    `
    .offline-banner {
      position: sticky; top: 0; z-index: 1000;
      padding: 8px 12px; background: #ffb703; color: #111;
      font-size: 14px; text-align: center;
    }
  `,
  ],
})
export class OfflineBannerComponent {
  online = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.online.set(true));
      window.addEventListener('offline', () => this.online.set(false));
    }
  }
}
