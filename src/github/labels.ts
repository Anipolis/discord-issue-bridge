import type { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger.js';

const LABEL_CACHE_TTL_MS = 60_000;
const DEFAULT_LABEL_COLOR = 'ededed';

interface CacheEntry {
  labels: Set<string>;
  fetchedAt: number;
}

const labelCache = new Map<string, CacheEntry>();

export async function getExistingLabelNames(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<Set<string>> {
  const key = `${owner}/${repo}`;
  const cached = labelCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < LABEL_CACHE_TTL_MS) {
    return cached.labels;
  }

  const names = new Set<string>();
  let page = 1;
  while (true) {
    const { data } = await octokit.issues.listLabelsForRepo({ owner, repo, per_page: 100, page });
    for (const label of data) {
      names.add(label.name);
    }
    if (data.length < 100) break;
    page++;
  }

  labelCache.set(key, { labels: names, fetchedAt: Date.now() });
  return names;
}

export function filterLabels(
  desired: string[],
  existing: Set<string>,
): { valid: string[]; missing: string[] } {
  const valid: string[] = [];
  const missing: string[] = [];
  for (const label of desired) {
    if (existing.has(label)) {
      valid.push(label);
    } else {
      missing.push(label);
    }
  }
  if (missing.length > 0) {
    logger.warn('labels_not_found', { missing });
  }
  return { valid, missing };
}

/**
 * Resolves desired labels against existing ones.
 * When createMissingLabels is true, missing labels are created (with a default color)
 * so every mapped tag gets a GitHub label applied.
 */
export async function ensureLabels(
  octokit: Octokit,
  owner: string,
  repo: string,
  desired: string[],
  existing: Set<string>,
): Promise<string[]> {
  const { valid, missing } = filterLabels(desired, existing);
  for (const name of missing) {
    try {
      await octokit.issues.createLabel({ owner, repo, name, color: DEFAULT_LABEL_COLOR });
      valid.push(name);
      existing.add(name);
      logger.info('label_created', { owner, repo, name });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('label_create_failed', { name, error: message });
    }
  }
  return valid;
}
