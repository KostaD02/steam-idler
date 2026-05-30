const MARKER = '<!-- build-artifacts-report -->';
const MAX_ENTRIES = 15;

module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo;
  const issueNumber = context.issue.number;
  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;
  const prCommitCount = process.env.PR_COMMIT_COUNT || 'X';
  const headSha = context.payload.pull_request?.head?.sha || context.sha || '';

  const entry = {
    sha: headSha.slice(0, 7),
    count: prCommitCount,
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    bundleUrl: process.env.ARTIFACT_URL || runUrl,
    clientUrl: process.env.CLIENT_IMAGE_URL || runUrl,
    serverUrl: process.env.SERVER_IMAGE_URL || runUrl,
    clientTag: process.env.CLIENT_IMAGE_TAG || '',
    serverTag: process.env.SERVER_IMAGE_TAG || '',
  };

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  const existing = comments.find((c) => c.body && c.body.includes(MARKER));

  let entries = [];

  if (existing) {
    const match = existing.body.match(/<!-- data:(.*?)-->/s);

    if (match) {
      try {
        entries = JSON.parse(match[1].trim());
      } catch {
        entries = [];
      }
    }
  }

  entries.unshift(entry);
  entries = entries.slice(0, MAX_ENTRIES);

  const body = renderBody(issueNumber, entries);

  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  }
};

function renderBody(issueNumber, entries) {
  const [latest, ...previous] = entries;
  const bundleName = `Steam-Idler-PR-${issueNumber}-${latest.count}`;
  const clientTar = `Steam-Idler-Client-PR-${issueNumber}-${latest.count}.tar`;
  const serverTar = `Steam-Idler-Server-PR-${issueNumber}-${latest.count}.tar`;

  const lines = [
    MARKER,
    `<!-- data:${JSON.stringify(entries)}-->`,
    `## ✅ Build artifacts`,
    ``,
    `**Latest - \`${latest.sha}\` · build #${latest.count}** _(updated ${latest.date} UTC)_`,
    ``,
    `📦 **[Download ${bundleName}.zip](${latest.bundleUrl})**`,
  ];

  if (latest.clientTag && latest.serverTag) {
    lines.push(
      ``,
      `🐳 Client → **[${clientTar}](${latest.clientUrl})** (\`${latest.clientTag}\`)\n🐳Server → **[${serverTar}](${latest.serverUrl})** (\`${latest.serverTag}\`)`,
      ``,
      `\`\`\`bash`,
      `docker load -i ${clientTar}`,
      `docker load -i ${serverTar}`,
      `\`\`\``,
    );
  }

  if (previous.length) {
    lines.push(
      ``,
      `<details>`,
      `<summary>📜 Previous builds (${previous.length})</summary>`,
      ``,
      `| Commit | Build | Bundle | Docker |`,
      `| --- | --- | --- | --- |`,
      ...previous.map((e) => {
        const docker =
          e.clientTag && e.serverTag
            ? `[client](${e.clientUrl}) · [server](${e.serverUrl})`
            : '-';

        return `| \`${e.sha}\` | #${e.count} | [bundle](${e.bundleUrl}) | ${docker} |`;
      }),
      ``,
      `</details>`,
    );
  }

  return lines.join('\n');
}
