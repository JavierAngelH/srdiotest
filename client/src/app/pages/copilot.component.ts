import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ZapService } from '../services/zap.service';

@Component({
  selector: 'app-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">srdiotest</a>
    </header>

    <section class="panel">
      <a routerLink="/" class="back">← Back to Zaps</a>
      <h1 class="page-title">Zap Copilot</h1>
      <p class="muted" style="max-width: 36rem">
        Describe a workflow in plain English. Copilot drafts a Zap into the normal create form —
        you review it, then turn it on. It never runs until you enable and save.
      </p>

      <ol class="steps">
        <li>You type something like “When a PR is opened, comment thanks.”</li>
        <li>Server parses that into the same Zap JSON shape (trigger + action + mapping).</li>
        <li>You land on New Zap with fields filled — edit if needed, enable, save.</li>
        <li>Execution is unchanged: webhook → matching Zap → GitHub comment.</li>
      </ol>

      <label class="field" style="max-width: 36rem; margin-bottom: 1rem">
        Prompt
        <textarea
          rows="3"
          [(ngModel)]="prompt"
          placeholder="When a PR is opened, comment thanks @{{ '{{sender}}' }}"
        ></textarea>
      </label>

      <button type="button" class="btn btn-accent" (click)="draft()" [disabled]="busy()">
        {{ busy() ? 'Drafting…' : 'Draft Zap' }}
      </button>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      @if (note()) {
        <p class="muted" style="margin-top: 0.75rem">{{ note() }}</p>
      }
    </section>
  `,
})
export class CopilotComponent {
  prompt = 'When a pull request is opened, comment "Thanks @{{sender}} — on it."';
  busy = signal(false);
  error = signal('');
  note = signal('');

  constructor(
    private zaps: ZapService,
    private router: Router
  ) {}

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
