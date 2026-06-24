CREATE TABLE IF NOT EXISTS issue_links (
  id                          INTEGER  PRIMARY KEY AUTOINCREMENT,
  discord_guild_id            TEXT     NOT NULL,
  discord_channel_id          TEXT     NOT NULL,
  discord_thread_id           TEXT     NOT NULL,
  discord_thread_url          TEXT     NOT NULL,
  github_owner                TEXT     NOT NULL,
  github_repo                 TEXT     NOT NULL,
  github_issue_number         INTEGER  NOT NULL,
  github_issue_url            TEXT     NOT NULL,
  created_by_discord_user_id  TEXT     NOT NULL,
  created_by_discord_username TEXT     NOT NULL,
  created_at                  DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at                  DATETIME NOT NULL DEFAULT (datetime('now')),
  UNIQUE(discord_thread_id)
);
