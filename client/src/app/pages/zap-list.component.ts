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
    <header class="topbar">
      <a routerLink="/" class="brand">srdiotest</a>
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
      <section class="panel hero-panel">
        <h1 class="hero-brand">srdiotest</h1>
        <p class="hero-copy">
          Tiny workflows for GitHub. Sign in, wire a Zap, open a PR — get the comment you configured.
        </p>
        <div>
          <button type="button" class="btn btn-accent" (click)="auth.login()">
            Sign in with GitHub
          </button>
        </div>
      </section>
    } @else {
      <section class="panel">
        <div class="toolbar">
          <h1 class="page-title">Your Zaps</h1>
          <div class="actions">
            <a routerLink="/zaps/new" class="btn btn-primary">New Zap</a>
            <a routerLink="/copilot" class="btn btn-ghost">Copilot</a>
          </div>
        </div>

        @if (error()) {
          <p class="err">{{ error() }}</p>
        }

        @if (!zaps().length) {
          <p class="muted">No Zaps yet. Create one that comments when a PR is opened.</p>
        } @else {
          <ul class="zap-list">
            @for (z of zaps(); track z.id) {
              <li>
                <div class="zap-main">
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
      </section>
    }
  `,
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
