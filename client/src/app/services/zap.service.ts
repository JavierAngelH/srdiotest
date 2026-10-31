import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ZapTrigger {
  app: string;
  event: string;
}

export interface ZapAction {
  app: string;
  type: string;
  mapping: Record<string, string>;
}

export interface Zap {
  id?: string;
  name: string;
  enabled: boolean;
  trigger: ZapTrigger;
  action: ZapAction;
}

export const APPS = [
  { id: 'github', name: 'GitHub', real: true },
  { id: 'slack', name: 'Slack', real: false },
  { id: 'linear', name: 'Linear', real: false },
  { id: 'jira', name: 'Jira', real: false },
  { id: 'notion', name: 'Notion', real: false },
] as const;

export const TRIGGERS: Record<string, { event: string; label: string }[]> = {
  github: [{ event: 'pull_request.opened', label: 'Pull request opened' }],
  slack: [{ event: 'message.posted', label: 'Message posted (stub)' }],
  linear: [{ event: 'issue.created', label: 'Issue created (stub)' }],
  jira: [{ event: 'issue.created', label: 'Issue created (stub)' }],
  notion: [{ event: 'page.updated', label: 'Page updated (stub)' }],
};

export const ACTIONS: Record<string, { type: string; label: string }[]> = {
  github: [{ type: 'create_issue_comment', label: 'Create issue/PR comment' }],
  slack: [{ type: 'post_message', label: 'Post message (stub)' }],
  linear: [{ type: 'create_comment', label: 'Create comment (stub)' }],
  jira: [{ type: 'add_comment', label: 'Add comment (stub)' }],
  notion: [{ type: 'append_block', label: 'Append block (stub)' }],
};

@Injectable({ providedIn: 'root' })
export class ZapService {
  constructor(private http: HttpClient) {}

  list(): Promise<Zap[]> {
    return firstValueFrom(this.http.get<Zap[]>(`${environment.apiUrl}/api/zaps`));
  }

  get(id: string): Promise<Zap> {
    return firstValueFrom(this.http.get<Zap>(`${environment.apiUrl}/api/zaps/${id}`));
  }

  create(zap: Zap): Promise<Zap> {
    return firstValueFrom(this.http.post<Zap>(`${environment.apiUrl}/api/zaps`, zap));
  }

  update(id: string, patch: Partial<Zap>): Promise<Zap> {
    return firstValueFrom(this.http.patch<Zap>(`${environment.apiUrl}/api/zaps/${id}`, patch));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/api/zaps/${id}`));
  }

  draftFromPrompt(prompt: string): Promise<Zap & { note?: string; confidence?: string }> {
    return firstValueFrom(
      this.http.post<Zap & { note?: string; confidence?: string }>(
        `${environment.apiUrl}/api/copilot/draft`,
        { prompt }
      )
    );
  }
}
