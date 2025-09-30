import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-users-page',
  imports: [CommonModule],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.css'],
})
export class AdminUsersPage {
  panelOpen = false;
  contact: 'phone' | 'email' = 'phone';

  openPanel() {
    this.panelOpen = true;
  }
  closePanel() {
    this.panelOpen = false;
  }
  setContact(v: 'phone' | 'email') {
    this.contact = v;
  }
}
