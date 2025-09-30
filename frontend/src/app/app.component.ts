import { Component } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { OfflineBannerComponent } from './shared/offline-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    // чтобы работали <router-outlet>, routerLink, routerLinkActive и *ngIf
    RouterOutlet,
    OfflineBannerComponent,
    RouterLink,
    RouterLinkActive,
    NgIf,
    AsyncPipe,
  ],
})
export class AppComponent {}
