import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

router.use(requireAuth);

const ZAP_SYSTEM =
  'Return JSON for a Zap: {name, enabled:false, trigger:{app:"github",event:"pull_request.opened"}, action:{app:"github",type:"create_issue_comment",mapping:{body:string}}}. body may use {{sender}}, {{repo}}, {{owner}}, {{number}}, {{title}}. Prefer a short friendly comment body from the user prompt.';

/** Rule-based NL → Zap draft. Used when no LLM key is set, or as fallback. */
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
    source: 'rules' as const,
  };
}

function normalizeDraft(parsed: any, source: 'gemini' | 'openai' | 'rules') {
  return {
    name: String(parsed?.name || 'PR thank-you comment'),
    enabled: false,
    trigger: {
      app: 'github',
      event: parsed?.trigger?.event || 'pull_request.opened',
    },
    action: {
      app: 'github',
      type: 'create_issue_comment',
      mapping: {
        body: String(parsed?.action?.mapping?.body || parsed?.mapping?.body || 'Thanks @{{sender}}!'),
      },
    },
    confidence: 'high' as const,
    note:
      source === 'rules'
        ? 'Drafted from your prompt — review and enable.'
        : `Drafted by Copilot (${source}) — review and enable.`,
    source,
  };
}

router.post('/draft', async (req: AuthRequest, res: Response) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  if (config.geminiApiKey) {
    try {
      const draft = await draftWithGemini(prompt);
      return res.json(draft);
    } catch (err) {
      console.warn('Gemini draft failed, trying next backend', err);
    }
  }

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

/** Google AI Studio — OpenAI-compatible chat completions endpoint. */
async function draftWithGemini(prompt: string) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ZAP_SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Gemini returned empty content');
  const parsed = typeof content === 'string' ? JSON.parse(content) : content;
  return normalizeDraft(parsed, 'gemini');
}

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
        { role: 'system', content: ZAP_SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as any;
  const parsed = JSON.parse(data.choices[0].message.content);
  return normalizeDraft(parsed, 'openai');
}

export default router;
