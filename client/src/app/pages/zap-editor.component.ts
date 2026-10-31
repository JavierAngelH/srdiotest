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
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-zap-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <p><a routerLink="/">← Back</a></p>
    <h1>{{ isNew() ? 'New Zap' : 'Edit Zap' }}</h1>

    @if (error()) {
      <p class="err">{{ error() }}</p>
    }

    <form (ngSubmit)="save()" class="form">
      <label>
        Name
        <input name="name" [(ngModel)]="model.name" required />
      </label>

      <label class="row">
        <input type="checkbox" name="enabled" [(ngModel)]="model.enabled" />
        Enabled
      </label>

      <fieldset>
        <legend>Trigger</legend>
        <label>
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
        <label>
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

      <fieldset>
        <legend>Action</legend>
        <label>
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
        <label>
          Type
          <select name="actionType" [(ngModel)]="model.action.type">
            @for (t of actionOptions(); track t.type) {
              <option [value]="t.type">{{ t.label }}</option>
            }
          </select>
        </label>
        <label>
          Comment body
          <textarea
            name="body"
            rows="4"
            [(ngModel)]="model.action.mapping.body"
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

      <button type="submit" class="primary" [disabled]="saving()">
        {{ saving() ? 'Saving…' : 'Save Zap' }}
      </button>
    </form>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 32rem;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.9rem;
      }
      label.row {
        flex-direction: row;
        align-items: center;
      }
      input,
      select,
      textarea {
        font: inherit;
        padding: 0.45rem 0.55rem;
        border: 1px solid #ccc;
        border-radius: 6px;
      }
      fieldset {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .hint {
        font-size: 0.8rem;
        color: #666;
        margin: 0;
      }
      .warn {
        color: #9a6700;
        font-size: 0.85rem;
        margin: 0;
      }
      .err {
        color: #a11;
      }
      .primary {
        background: #24292f;
        color: #fff;
        border: none;
        padding: 0.55rem 0.9rem;
        border-radius: 6px;
        cursor: pointer;
        font: inherit;
        align-self: flex-start;
      }
      .primary:disabled {
        opacity: 0.6;
      }
    `,
  ],
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
    private zapsApi: ZapService,
    private auth: AuthService
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
    await this.auth.refreshMe();
    if (!this.auth.user()) {
      this.router.navigateByUrl('/');
      return;
    }

    const draft = sessionStorage.getItem('zapDraft');
    if (draft && this.route.snapshot.paramMap.get('id') === 'new') {
      try {
        this.model = { ...this.model, ...JSON.parse(draft) };
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem('zapDraft');
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNew.set(true);
      return;
    }
    this.isNew.set(false);
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
