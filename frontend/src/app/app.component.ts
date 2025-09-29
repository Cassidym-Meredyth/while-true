import { Component } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    // чтобы работали <router-outlet>, routerLink, routerLinkActive и *ngIf
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
    AsyncPipe,
  ],
})
export class AppComponent {}
