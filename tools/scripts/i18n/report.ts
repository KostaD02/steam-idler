import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DEFAULT_LOCALE, REPORT_DIR, ROOT } from './constants';
import { BuildMeta, ReportData } from './types';

export function renderBar(percent: number): string {
  const filled = Math.round(percent / 10);
  return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`;
}

export function renderBuildLine(build: BuildMeta): string {
  const { shortSha, buildNumber, updatedAt } = build;
  return `**Latest - ${shortSha} · build N${buildNumber}** _(updated ${updatedAt} UTC)_`;
}

export function buildMarkdownReport(data: ReportData): string {
  const { locales, defaultFlatCount, requiredCount } = data;
  const lines = [`<!-- i18n-coverage-report -->`, `## 🌍 i18n Coverage`, ``];

  if (data.build) {
    lines.push(``, renderBuildLine(data.build), ``);
  }

  lines.push(
    `**${locales.length} locales** supported. \`${DEFAULT_LOCALE}\` reference bundle has **${defaultFlatCount} keys** (${requiredCount} BE error keys + ${defaultFlatCount - requiredCount} UI keys).`,
    ``,
    `| Locale | Native | Coverage | |`,
    `| --- | --- | --- | --- |`,
  );

  for (const row of locales) {
    const bar = renderBar(row.percent);
    lines.push(
      `| \`${row.locale}\` | ${row.label} | ${row.count}/${defaultFlatCount} (${row.percent}%) | ${bar} |`,
    );
  }

  lines.push(
    ``,
    `Missing keys fall back to \`${DEFAULT_LOCALE}\` at runtime.`,
    ``,
    `> [!TIP]`,
    `> Want to test before pushing? Run \`pnpm validate:i18n\` locally.`,
  );

  return lines.join('\n');
}

export function writeReports(data: ReportData): void {
  mkdirSync(resolve(ROOT, REPORT_DIR), { recursive: true });
  writeFileSync(
    resolve(ROOT, REPORT_DIR, 'i18n-report.json'),
    JSON.stringify(data, null, 2) + '\n',
  );
  writeFileSync(
    resolve(ROOT, REPORT_DIR, 'i18n-report.md'),
    buildMarkdownReport(data) + '\n',
  );
}
