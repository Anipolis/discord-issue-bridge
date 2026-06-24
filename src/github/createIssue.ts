import type { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger.js';

export interface CreateIssueParams {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels: string[];
  dryRun: boolean;
}

export interface CreatedIssue {
  number: number;
  url: string;
}

export async function createIssue(
  octokit: Octokit,
  params: CreateIssueParams,
): Promise<CreatedIssue> {
  const { owner, repo, title, body, labels, dryRun } = params;

  if (dryRun) {
    logger.info('dry_run_issue', { owner, repo, title, labels, body_length: body.length });
    return { number: 0, url: `https://github.com/${owner}/${repo}/issues/0` };
  }

  const { data } = await octokit.issues.create({ owner, repo, title, body, labels });
  return { number: data.number, url: data.html_url };
}
