import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
    <main class="shell">
      <h1>srdiotest</h1>
      @if (!auth.loaded()) {
        <p>Loading…</p>
      } @else if (auth.user(); as u) {
        <p>Signed in as <strong>{{ u.login }}</strong></p>
        <button type="button" (click)="auth.logout()">Sign out</button>
      } @else {
        <p>Sign in to manage Zaps.</p>
        <button type="button" (click)="auth.login()">Sign in with GitHub</button>
      }
    </main>
  `,
  styles: [
    `
      .shell {
        max-width: 40rem;
        margin: 2rem auto;
        padding: 0 1rem;
        font-family: system-ui, sans-serif;
      }
      button {
        background: #24292f;
        color: #fff;
        border: none;
        padding: 0.5rem 0.85rem;
        border-radius: 6px;
        cursor: pointer;
        font: inherit;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  constructor(public auth: AuthService) {}
  ngOnInit() {
    this.auth.refreshMe();
  }
}
