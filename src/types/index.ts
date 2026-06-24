export interface ForumPostData {
  threadId: string;
  threadName: string;
  threadUrl: string;
  guildId: string;
  channelId: string;
  authorId: string;
  authorName: string;
  body: string;
  attachmentUrls: string[];
  tagNames: string[];
  createdAt: Date;
}

export interface IssueLink {
  id?: number;
  discord_guild_id: string;
  discord_channel_id: string;
  discord_thread_id: string;
  discord_thread_url: string;
  github_owner: string;
  github_repo: string;
  github_issue_number: number;
  github_issue_url: string;
  created_by_discord_user_id: string;
  created_by_discord_username: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppConfig {
  tagMap: Record<string, string>;
  ignoreTags: string[];
  createMissingLabels: boolean;
  replyWhenCreated: boolean;
  replyWhenAlreadyLinked: boolean;
  syncThreadRepliesToIssueComments: boolean;
}

export interface EnvConfig {
  discordToken: string;
  discordForumChannelIds: string[];
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  databaseUrl: string;
  logLevel: string;
  dryRun: boolean;
}
