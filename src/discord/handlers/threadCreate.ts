import { ChannelType, type AnyThreadChannel } from 'discord.js';
import type { Octokit } from '@octokit/rest';
import type { Db } from '../../db/index.js';
import type { AppConfig, EnvConfig } from '../../types/index.js';
import { forumPostToIssue } from '../../services/forumPostToIssue.js';
import { logger } from '../../utils/logger.js';

export async function handleThreadCreate(
  thread: AnyThreadChannel,
  newlyCreated: boolean,
  db: Db,
  octokit: Octokit,
  envConfig: EnvConfig,
  appConfig: AppConfig,
): Promise<void> {
  if (!newlyCreated) return;

  if (thread.parent?.type !== ChannelType.GuildForum) return;

  if (!envConfig.discordForumChannelIds.includes(thread.parentId ?? '')) {
    logger.debug('skipping_non_target_channel', {
      thread_id: thread.id,
      parent_id: thread.parentId,
    });
    return;
  }

  logger.info('thread_create_received', {
    thread_id: thread.id,
    thread_name: thread.name,
    parent_id: thread.parentId,
  });

  try {
    await forumPostToIssue(thread, db, octokit, envConfig, appConfig);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('thread_create_handler_error', { thread_id: thread.id, error: message });
  }
}
