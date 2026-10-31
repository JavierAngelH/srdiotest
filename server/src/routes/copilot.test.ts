import { describe, expect, it } from 'vitest';
import { parseZapIntent } from './copilot';

describe('parseZapIntent', () => {
  it('drafts GitHub PR opened → comment from a natural sentence', () => {
    const draft = parseZapIntent('When a pull request is opened, comment thanks');
    expect(draft.trigger).toEqual({ app: 'github', event: 'pull_request.opened' });
    expect(draft.action.app).toBe('github');
    expect(draft.action.type).toBe('create_issue_comment');
    expect(draft.enabled).toBe(false);
    expect(draft.confidence).toBe('high');
    expect(draft.action.mapping.body).toMatch(/thanks/i);
  });

  it('uses a quoted comment body', () => {
    const draft = parseZapIntent('When a PR is opened, comment "Nice work"');
    expect(draft.action.mapping.body).toBe('Nice work');
  });

  it('still returns a reviewable GitHub draft when confidence is low', () => {
    const draft = parseZapIntent('notify slack');
    expect(draft.confidence).toBe('low');
    expect(draft.trigger.app).toBe('github');
    expect(draft.enabled).toBe(false);
  });
});
