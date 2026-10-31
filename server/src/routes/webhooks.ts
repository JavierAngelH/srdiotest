import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { User } from '../models/User';
import { Zap } from '../models/Zap';
import { createIssueComment, renderTemplate } from '../services/github';

const router = Router();

function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!config.githubWebhookSecret) return false;
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expected = crypto
    .createHmac('sha256', config.githubWebhookSecret)
    .update(rawBody)
    .digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

router.post('/github', async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!rawBody || !verifySignature(rawBody, req.header('X-Hub-Signature-256') || undefined)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.header('X-GitHub-Event');
  const payload = req.body;

  if (event === 'ping') {
    return res.json({ ok: true, message: 'pong' });
  }

  if (event !== 'pull_request' || payload?.action !== 'opened') {
    return res.json({ ok: true, skipped: true });
  }

  const senderLogin: string = payload.sender?.login;
  const owner: string = payload.repository?.owner?.login;
  const repo: string = payload.repository?.name;
  const prNumber: number = payload.pull_request?.number;
  const installationIrrelevant = !senderLogin || !owner || !repo || !prNumber;

  if (installationIrrelevant) {
    return res.status(400).json({ error: 'Malformed PR payload' });
  }

  // Match Zaps for the PR author (OAuth user) — they own the Zap and their token posts the comment.
  const user = await User.findOne({ login: senderLogin });
  if (!user) {
    console.log(`No user for sender ${senderLogin}; skipping`);
    return res.json({ ok: true, matched: 0 });
  }

  const zaps = await Zap.find({
    userId: user._id,
    enabled: true,
    'trigger.app': 'github',
    'trigger.event': 'pull_request.opened',
    'action.app': 'github',
    'action.type': 'create_issue_comment',
  });

  const results: Array<{ zapId: string; ok: boolean; error?: string }> = [];

  for (const zap of zaps) {
    try {
      const mapping =
        zap.action.mapping instanceof Map
          ? Object.fromEntries(zap.action.mapping)
          : (zap.action.mapping as any) || {};
      const template = mapping.body || 'Thanks @{{sender}}!';
      const body = renderTemplate(template, {
        sender: senderLogin,
        repo,
        owner,
        number: String(prNumber),
        title: payload.pull_request?.title || '',
      });

      await createIssueComment({
        token: user.accessToken,
        owner,
        repo,
        issueNumber: prNumber,
        body,
      });
      results.push({ zapId: String(zap._id), ok: true });
    } catch (err: any) {
      console.error('Zap execution failed', zap._id, err);
      results.push({ zapId: String(zap._id), ok: false, error: err?.message });
    }
  }

  res.json({ ok: true, matched: zaps.length, results });
});

export default router;
