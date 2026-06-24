import type { Db } from './index.js';
import type { IssueLink } from '../types/index.js';

export function findByThreadId(db: Db, threadId: string): IssueLink | undefined {
  return db.prepare('SELECT * FROM issue_links WHERE discord_thread_id = ?').get(threadId) as
    | IssueLink
    | undefined;
}

type ClaimRecord = Omit<
  IssueLink,
  'id' | 'github_issue_number' | 'github_issue_url' | 'created_at' | 'updated_at'
>;

/**
 * Atomically reserves a thread before calling GitHub.
 * Uses INSERT OR IGNORE with a placeholder issue_number=0.
 * Returns true if this caller successfully claimed the thread, false if already claimed.
 */
export function claimThread(db: Db, record: ClaimRecord): boolean {
  const result = db
    .prepare(
      `INSERT OR IGNORE INTO issue_links (
        discord_guild_id, discord_channel_id, discord_thread_id, discord_thread_url,
        github_owner, github_repo, github_issue_number, github_issue_url,
        created_by_discord_user_id, created_by_discord_username
      ) VALUES (
        @discord_guild_id, @discord_channel_id, @discord_thread_id, @discord_thread_url,
        @github_owner, @github_repo, 0, '',
        @created_by_discord_user_id, @created_by_discord_username
      )`,
    )
    .run(record);
  return result.changes > 0;
}

/** Updates the pending placeholder row with the real GitHub Issue data after successful creation. */
export function finalizeThread(
  db: Db,
  threadId: string,
  issueNumber: number,
  issueUrl: string,
): void {
  db.prepare(
    `UPDATE issue_links
     SET github_issue_number = ?, github_issue_url = ?, updated_at = datetime('now')
     WHERE discord_thread_id = ? AND github_issue_number = 0`,
  ).run(issueNumber, issueUrl, threadId);
}

/** Removes the pending placeholder row so the thread can be retried on failure. */
export function releaseThread(db: Db, threadId: string): void {
  db.prepare(
    `DELETE FROM issue_links WHERE discord_thread_id = ? AND github_issue_number = 0`,
  ).run(threadId);
}
