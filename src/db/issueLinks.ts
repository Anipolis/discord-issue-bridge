import type { Db } from './index.js';
import type { IssueLink } from '../types/index.js';

export function findByThreadId(db: Db, threadId: string): IssueLink | undefined {
  return db.prepare('SELECT * FROM issue_links WHERE discord_thread_id = ?').get(threadId) as
    | IssueLink
    | undefined;
}

export function insert(db: Db, record: Omit<IssueLink, 'id' | 'created_at' | 'updated_at'>): void {
  db.prepare(`
    INSERT INTO issue_links (
      discord_guild_id, discord_channel_id, discord_thread_id, discord_thread_url,
      github_owner, github_repo, github_issue_number, github_issue_url,
      created_by_discord_user_id, created_by_discord_username
    ) VALUES (
      @discord_guild_id, @discord_channel_id, @discord_thread_id, @discord_thread_url,
      @github_owner, @github_repo, @github_issue_number, @github_issue_url,
      @created_by_discord_user_id, @created_by_discord_username
    )
  `).run(record);
}
