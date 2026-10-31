import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

router.use(requireAuth);

/** Rule-based NL → Zap draft. Optional OpenAI if OPENAI_API_KEY is set. */
export function parseZapIntent(prompt: string) {
  const lower = prompt.toLowerCase();
  const wantsPr =
    /pull\s*request|pr\b|merge\s*request/.test(lower) &&
    /(open|opened|created|new)/.test(lower);
  const wantsComment = /comment|reply|say|post/.test(lower);

  let body = 'Thanks @{{sender}}!';
  const quoted = prompt.match(/["']([^"']+)["']/);
  if (quoted) {
    body = quoted[1];
  } else {
    const thanks = prompt.match(/comment\s+(.+)$/i);
    if (thanks) body = thanks[1].trim();
  }

  const nameMatch = prompt.match(/named?\s+["']?([^"'.]+)["']?/i);
  const name = nameMatch?.[1]?.trim() || 'PR thank-you comment';

  if (!wantsPr || !wantsComment) {
    // Still return a best-effort GitHub PR→comment draft for review
  }

  return {
    name,
    enabled: false,
    trigger: { app: 'github', event: 'pull_request.opened' },
    action: {
      app: 'github',
      type: 'create_issue_comment',
      mapping: { body },
    },
    confidence: wantsPr && wantsComment ? 'high' : 'low',
    note:
      wantsPr && wantsComment
        ? 'Drafted from your prompt — review and enable.'
        : 'Best-effort draft for GitHub PR opened → comment. Edit before enabling.',
  };
}

router.post('/draft', async (req: AuthRequest, res: Response) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  if (config.openaiApiKey) {
    try {
      const draft = await draftWithOpenAI(prompt);
      return res.json(draft);
    } catch (err) {
      console.warn('OpenAI draft failed, falling back to rules', err);
    }
  }

  res.json(parseZapIntent(prompt));
});

async function draftWithOpenAI(prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Return JSON for a Zap: {name, enabled:false, trigger:{app:"github",event:"pull_request.opened"}, action:{app:"github",type:"create_issue_comment",mapping:{body:string}}}. body may use {{sender}}, {{repo}}, {{owner}}, {{number}}, {{title}}.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as any;
  const parsed = JSON.parse(data.choices[0].message.content);
  return { ...parsed, enabled: false, confidence: 'high', note: 'Drafted by Copilot — review and enable.' };
}

export default router;
