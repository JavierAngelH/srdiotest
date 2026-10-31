import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ZapService } from '../services/zap.service';

@Component({
  selector: 'app-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <p><a routerLink="/">← Back</a></p>
    <h1>Zap Copilot</h1>
    <p class="muted">
      Describe a workflow in plain English. We’ll draft a Zap you can review and enable.
    </p>

    <label>
      Prompt
      <textarea
        rows="3"
        [(ngModel)]="prompt"
        placeholder="When a PR is opened, comment thanks @{{ '{{sender}}' }}"
      ></textarea>
    </label>

    <button type="button" class="primary" (click)="draft()" [disabled]="busy()">
      {{ busy() ? 'Drafting…' : 'Draft Zap' }}
    </button>

    @if (error()) {
      <p class="err">{{ error() }}</p>
    }
    @if (note()) {
      <p class="note">{{ note() }}</p>
    }
  `,
  styles: [
    `
      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        max-width: 36rem;
        margin-bottom: 1rem;
      }
      textarea {
        font: inherit;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 6px;
      }
      .primary {
        background: #24292f;
        color: #fff;
        border: none;
        padding: 0.55rem 0.9rem;
        border-radius: 6px;
        cursor: pointer;
        font: inherit;
      }
      .muted {
        color: #666;
      }
      .err {
        color: #a11;
      }
      .note {
        color: #0550ae;
      }
    `,
  ],
})
export class CopilotComponent implements OnInit {
  prompt = 'When a pull request is opened, comment "Thanks @{{sender}} — on it."';
  busy = signal(false);
  error = signal('');
  note = signal('');

  constructor(
    private auth: AuthService,
    private zaps: ZapService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.auth.refreshMe();
    if (!this.auth.user()) this.router.navigateByUrl('/');
  }

  async draft() {
    this.busy.set(true);
    this.error.set('');
    this.note.set('');
    try {
      const draft = await this.zaps.draftFromPrompt(this.prompt);
      sessionStorage.setItem(
        'zapDraft',
        JSON.stringify({
          name: draft.name,
          enabled: false,
          trigger: draft.trigger,
          action: draft.action,
        })
      );
      this.note.set(draft.note || 'Draft ready — opening editor.');
      this.router.navigateByUrl('/zaps/new');
    } catch (e: any) {
      this.error.set(e?.error?.error || e?.message || 'Draft failed');
    } finally {
      this.busy.set(false);
    }
  }
}
