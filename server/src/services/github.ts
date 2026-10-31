export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

export async function createIssueComment(opts: {
  token: string;
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}): Promise<{ id: number; html_url: string }> {
  const url = `https://api.github.com/repos/${opts.owner}/${opts.repo}/issues/${opts.issueNumber}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'srdiotest',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ body: opts.body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub comment failed (${res.status}): ${text}`);
  }

  return (await res.json()) as { id: number; html_url: string };
}
