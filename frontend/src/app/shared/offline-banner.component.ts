// Блок "Нет соединения" — как на карточке справа в твоем первом экране.
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-offline-banner',
  template: `
    <!-- имитируем оффлайн: поменяй значение на true/false по надобности -->
    <div *ngIf="!online()" class="offline">Нет соединения. Действия поставлены в очередь.</div>
  `,
  styles: [
    `
    .offline{
      margin: 12px 0;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #ffe1a7;
      background: #fff7e0;
      color: #7a5200;
      font-size: 14px;
    }
  `,
  ],
})
export class OfflineBannerComponent {
  // сигнал просто для демонстрации. Дальше можно связать с navigator.onLine
  online = signal(true);
}
