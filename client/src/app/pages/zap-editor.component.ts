import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ACTIONS,
  APPS,
  TRIGGERS,
  Zap,
  ZapService,
} from '../services/zap.service';

@Component({
  selector: 'app-zap-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">srdiotest</a>
    </header>

    <section class="panel">
      <a routerLink="/" class="back">← Back to Zaps</a>
      <h1 class="page-title">{{ isNew() ? 'New Zap' : 'Edit Zap' }}</h1>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <form (ngSubmit)="save()" class="stack-form" style="margin-top: 1rem">
        <label class="field">
          Name
          <input name="name" [(ngModel)]="model.name" required />
        </label>

        <label class="field row">
          <input type="checkbox" name="enabled" [(ngModel)]="model.enabled" />
          Enabled
        </label>

        <fieldset class="block">
          <legend>Trigger</legend>
          <label class="field">
            App
            <select
              name="triggerApp"
              [(ngModel)]="model.trigger.app"
              (ngModelChange)="onTriggerAppChange()"
            >
              @for (a of apps; track a.id) {
                <option [value]="a.id">{{ a.name }}{{ a.real ? '' : ' (stub)' }}</option>
              }
            </select>
          </label>
          <label class="field">
            Event
            <select name="triggerEvent" [(ngModel)]="model.trigger.event">
              @for (t of triggerOptions(); track t.event) {
                <option [value]="t.event">{{ t.label }}</option>
              }
            </select>
          </label>
          @if (model.trigger.app !== 'github') {
            <p class="warn">Stub app — will not execute.</p>
          }
        </fieldset>

        <fieldset class="block">
          <legend>Action</legend>
          <label class="field">
            App
            <select
              name="actionApp"
              [(ngModel)]="model.action.app"
              (ngModelChange)="onActionAppChange()"
            >
              @for (a of apps; track a.id) {
                <option [value]="a.id">{{ a.name }}{{ a.real ? '' : ' (stub)' }}</option>
              }
            </select>
          </label>
          <label class="field">
            Type
            <select name="actionType" [(ngModel)]="model.action.type">
              @for (t of actionOptions(); track t.type) {
                <option [value]="t.type">{{ t.label }}</option>
              }
            </select>
          </label>
          <label class="field">
            Comment body
            <textarea
              name="body"
              rows="4"
              [(ngModel)]="model.action.mapping['body']"
              placeholder="Thanks @{{ '{{sender}}' }}!"
            ></textarea>
          </label>
          <p class="hint">
            Templates: <code>{{ '{{sender}}' }}</code>, <code>{{ '{{repo}}' }}</code>,
            <code>{{ '{{owner}}' }}</code>, <code>{{ '{{number}}' }}</code>,
            <code>{{ '{{title}}' }}</code>
          </p>
          @if (model.action.app !== 'github') {
            <p class="warn">Stub app — will not execute.</p>
          }
        </fieldset>

        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving…' : 'Save Zap' }}
        </button>
      </form>
    </section>
  `,
})
export class ZapEditorComponent implements OnInit {
  apps = APPS;
  isNew = signal(true);
  saving = signal(false);
  error = signal('');

  model: Zap = {
    name: '',
    enabled: false,
    trigger: { app: 'github', event: 'pull_request.opened' },
    action: {
      app: 'github',
      type: 'create_issue_comment',
      mapping: { body: 'Thanks @{{sender}}! Looking at this PR.' },
    },
  };

  private id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zapsApi: ZapService
  ) {}

  triggerOptions() {
    return TRIGGERS[this.model.trigger.app] || [];
  }

  actionOptions() {
    return ACTIONS[this.model.action.app] || [];
  }

  onTriggerAppChange() {
    const opts = this.triggerOptions();
    this.model.trigger.event = opts[0]?.event || '';
  }

  onActionAppChange() {
    const opts = this.actionOptions();
    this.model.action.type = opts[0]?.type || '';
    if (!this.model.action.mapping) this.model.action.mapping = { body: '' };
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const creating = !id || id === 'new';
    this.isNew.set(creating);

    // Copilot lands on /zaps/new (no :id). Apply the draft whenever this is a create.
    const draft = sessionStorage.getItem('zapDraft');
    if (draft && creating) {
      try {
        this.model = { ...this.model, ...JSON.parse(draft) };
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem('zapDraft');
    }

    if (creating) {
      return;
    }
    this.id = id;
    try {
      const zap = await this.zapsApi.get(id);
      this.model = {
        name: zap.name,
        enabled: zap.enabled,
        trigger: { ...zap.trigger },
        action: {
          app: zap.action.app,
          type: zap.action.type,
          mapping: { body: zap.action.mapping?.['body'] || '' },
        },
      };
    } catch {
      this.error.set('Zap not found');
    }
  }

  async save() {
    this.saving.set(true);
    this.error.set('');
    try {
      if (this.isNew()) {
        await this.zapsApi.create(this.model);
      } else if (this.id) {
        await this.zapsApi.update(this.id, this.model);
      }
      this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error.set(e?.error?.error || e?.message || 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
