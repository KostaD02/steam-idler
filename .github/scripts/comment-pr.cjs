module.exports = async ({ github, context }) => {
  const prCommitCount = process.env.PR_COMMIT_COUNT || 'X';
  const artifactUrl = process.env.ARTIFACT_URL;
  const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const downloadUrl = artifactUrl || runUrl;
  const artifactName = `Steam-Idler-PR-${context.issue.number}-${prCommitCount}`;
  const body = `✅ **Build Successful!**\n\nThe compiled client + server bundles have been uploaded as a workflow artifact. You can download and test them directly:\n\n📦 **[Download ${artifactName}.zip](${downloadUrl})**`;

  await github.rest.issues.createComment({
    body,
    repo: context.repo.repo,
    owner: context.repo.owner,
    issue_number: context.issue.number,
  });
};
