import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Zap, ZapService } from '../services/zap.service';

@Component({
  selector: 'app-zap-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top">
      <div class="brand">srdiotest</div>
      @if (auth.user(); as u) {
        <div class="who">
          @if (u.avatarUrl) {
            <img [src]="u.avatarUrl" alt="" width="28" height="28" />
          }
          <span>{{ u.login }}</span>
          <button type="button" class="linkish" (click)="logout()">Sign out</button>
        </div>
      }
    </header>

    @if (!auth.loaded()) {
      <p class="muted">Loading…</p>
    } @else if (!auth.user()) {
      <section class="hero">
        <h1>Workflows for the PRs you open</h1>
        <p>Sign in with GitHub, create a Zap, open a PR — get an automated comment.</p>
        <button type="button" class="primary" (click)="auth.login()">Sign in with GitHub</button>
      </section>
    } @else {
      <section class="toolbar">
        <h1>Your Zaps</h1>
        <div class="actions">
          <a routerLink="/zaps/new" class="primary">New Zap</a>
          <a routerLink="/copilot" class="secondary">Copilot</a>
        </div>
      </section>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      @if (!zaps().length) {
        <p class="muted">No Zaps yet. Create one that comments when a PR is opened.</p>
      } @else {
        <ul class="zap-list">
          @for (z of zaps(); track z.id) {
            <li>
              <div class="main">
                <a [routerLink]="['/zaps', z.id]">{{ z.name }}</a>
                <span class="meta"
                  >{{ z.trigger.app }} / {{ z.trigger.event }} → {{ z.action.app }} /
                  {{ z.action.type }}</span
                >
              </div>
              <label class="toggle">
                <input
                  type="checkbox"
                  [checked]="z.enabled"
                  (change)="toggle(z, $event)"
                />
                {{ z.enabled ? 'On' : 'Off' }}
              </label>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: [
    `
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .brand {
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .who {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        font-size: 0.9rem;
      }
      .who img {
        border-radius: 50%;
      }
      .hero {
        max-width: 36rem;
      }
      .hero h1 {
        font-size: 1.8rem;
        margin: 0 0 0.5rem;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .toolbar h1 {
        margin: 0;
        font-size: 1.4rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      .zap-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .zap-list li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 0;
        border-bottom: 1px solid #ddd;
      }
      .main {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .meta {
        font-size: 0.8rem;
        color: #666;
      }
      .toggle {
        font-size: 0.85rem;
        white-space: nowrap;
      }
      .muted {
        color: #666;
      }
      .err {
        color: #a11;
      }
      .primary,
      a.primary {
        background: #24292f;
        color: #fff;
        border: none;
        padding: 0.55rem 0.9rem;
        border-radius: 6px;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
        font: inherit;
      }
      .secondary,
      a.secondary {
        background: #eee;
        color: #111;
        border: none;
        padding: 0.55rem 0.9rem;
        border-radius: 6px;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
        font: inherit;
      }
      .linkish {
        background: none;
        border: none;
        color: #0969da;
        cursor: pointer;
        font: inherit;
        padding: 0;
      }
    `,
  ],
})
export class ZapListComponent implements OnInit {
  zaps = signal<Zap[]>([]);
  error = signal('');

  constructor(
    public auth: AuthService,
    private zapsApi: ZapService
  ) {}

  async ngOnInit() {
    await this.auth.refreshMe();
    if (this.auth.user()) {
      await this.reload();
    }
  }

  async reload() {
    try {
      this.zaps.set(await this.zapsApi.list());
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load Zaps');
    }
  }

  async toggle(z: Zap, ev: Event) {
    const enabled = (ev.target as HTMLInputElement).checked;
    try {
      const updated = await this.zapsApi.update(z.id!, { enabled });
      this.zaps.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      (ev.target as HTMLInputElement).checked = z.enabled;
      this.error.set('Could not update Zap');
    }
  }

  async logout() {
    await this.auth.logout();
    this.zaps.set([]);
  }
}
