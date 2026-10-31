import { Router, Response } from 'express';
import { config } from '../config';
import { User } from '../models/User';
import { requireAuth, signToken, AuthRequest } from '../middleware/auth';

const router = Router();

const GITHUB_SCOPES = ['read:user', 'repo'].join(' ');

router.get('/github', (_req, res) => {
  if (!config.githubClientId) {
    return res.status(500).send('GITHUB_CLIENT_ID is not configured');
  }
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    scope: GITHUB_SCOPES,
    redirect_uri: `http://localhost:${config.port}/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      return res
        .status(400)
        .send(tokenData.error_description || tokenData.error || 'OAuth failed');
    }

    const ghUserRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'srdiotest',
      },
    });
    const ghUser = (await ghUserRes.json()) as {
      id: number;
      login: string;
      avatar_url?: string;
    };

    let user = await User.findOne({ githubId: String(ghUser.id) });
    if (user) {
      user.login = ghUser.login;
      user.accessToken = tokenData.access_token;
      user.avatarUrl = ghUser.avatar_url;
      await user.save();
    } else {
      user = await User.create({
        githubId: String(ghUser.id),
        login: ghUser.login,
        accessToken: tokenData.access_token,
        avatarUrl: ghUser.avatar_url,
      });
    }

    const jwt = signToken(user.id);
    res.cookie('token', jwt, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${config.clientUrl}/?token=${encodeURIComponent(jwt)}`);
  } catch (err) {
    console.error('OAuth callback error', err);
    res.status(500).send('OAuth failed');
  }
});

router.post('/logout', (_req, res: Response) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

export function meHandler(req: AuthRequest, res: Response) {
  const u = req.user!;
  res.json({
    id: u.id,
    githubId: u.githubId,
    login: u.login,
    avatarUrl: u.avatarUrl,
  });
}

router.get('/me', requireAuth, meHandler);

export default router;
