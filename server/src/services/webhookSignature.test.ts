import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifyGitHubSignature } from './webhookSignature';

function sign(body: Buffer, secret: string) {
  const hex = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${hex}`;
}

describe('verifyGitHubSignature', () => {
  const body = Buffer.from('{"action":"opened"}');
  const secret = 'webhook-secret';

  it('accepts a valid X-Hub-Signature-256', () => {
    expect(verifyGitHubSignature(body, sign(body, secret), secret)).toBe(true);
  });

  it('rejects the wrong secret', () => {
    expect(verifyGitHubSignature(body, sign(body, 'other'), secret)).toBe(false);
  });

  it('rejects a missing or malformed header', () => {
    expect(verifyGitHubSignature(body, undefined, secret)).toBe(false);
    expect(verifyGitHubSignature(body, 'sha1=abc', secret)).toBe(false);
  });

  it('fails closed when the secret is empty', () => {
    expect(verifyGitHubSignature(body, sign(body, ''), '')).toBe(false);
  });
});
