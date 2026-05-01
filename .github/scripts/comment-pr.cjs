module.exports = async ({ github, context }) => {
  const prCommitCount = process.env.PR_COMMIT_COUNT || 'X';
  const artifactUrl = process.env.ARTIFACT_URL;
  const clientImageTag = process.env.CLIENT_IMAGE_TAG;
  const serverImageTag = process.env.SERVER_IMAGE_TAG;
  const clientImageUrl = process.env.CLIENT_IMAGE_URL;
  const serverImageUrl = process.env.SERVER_IMAGE_URL;

  const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const downloadUrl = artifactUrl || runUrl;
  const artifactName = `Steam-Idler-PR-${context.issue.number}-${prCommitCount}`;
  const clientArtifactName = `Steam-Idler-Client-PR-${context.issue.number}-${prCommitCount}`;
  const serverArtifactName = `Steam-Idler-Server-PR-${context.issue.number}-${prCommitCount}`;

  const lines = [
    `✅ **Build Successful!**`,
    ``,
    `The compiled client + server bundles have been uploaded as a workflow artifact. You can download and test them directly:`,
    ``,
    `📦 **[Download ${artifactName}.zip](${downloadUrl})**`,
  ];

  if (clientImageTag && serverImageTag) {
    lines.push(
      ``,
      `🐳 **Docker images** (built locally, saved as tarballs):`,
      ``,
      `- Client → **[${clientArtifactName}.tar](${clientImageUrl || runUrl})** (\`${clientImageTag}\`)`,
      `- Server → **[${serverArtifactName}.tar](${serverImageUrl || runUrl})** (\`${serverImageTag}\`)`,
      ``,
      `Load locally with:`,
      ``,
      `\`\`\`bash`,
      `docker load -i ${clientArtifactName}.tar`,
      `docker load -i ${serverArtifactName}.tar`,
      `\`\`\``,
    );
  }

  await github.rest.issues.createComment({
    body: lines.join('\n'),
    repo: context.repo.repo,
    owner: context.repo.owner,
    issue_number: context.issue.number,
  });
};
