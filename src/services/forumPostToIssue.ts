import type { AnyThreadChannel } from 'discord.js';
import type { Octokit } from '@octokit/rest';
import type { Db } from '../db/index.js';
import type { AppConfig, EnvConfig } from '../types/index.js';
import { findByThreadId, insert } from '../db/issueLinks.js';
import { getExistingLabelNames, filterLabels } from '../github/labels.js';
import { createIssue } from '../github/createIssue.js';
import { resolveTagNames, hasIgnoreTag, mapToGitHubLabels } from './tagMapper.js';
import { buildTitle, buildBody } from './issueBodyBuilder.js';
import { threadUrl } from '../utils/discordUrl.js';
import { logger } from '../utils/logger.js';

const STARTER_MESSAGE_RETRIES = 3;
const STARTER_MESSAGE_DELAY_MS = 1500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStarterMessageWithRetry(thread: AnyThreadChannel): Promise<string> {
  for (let attempt = 1; attempt <= STARTER_MESSAGE_RETRIES; attempt++) {
    try {
      const msg = await thread.fetchStarterMessage({ force: true });
      if (msg) return msg.content;
    } catch {
      // fall through to retry
    }
    if (attempt < STARTER_MESSAGE_RETRIES) {
      await sleep(STARTER_MESSAGE_DELAY_MS);
    }
  }
  logger.warn('starter_message_not_found', { thread_id: thread.id });
  return '';
}

export async function forumPostToIssue(
  thread: AnyThreadChannel,
  db: Db,
  octokit: Octokit,
  envConfig: EnvConfig,
  appConfig: AppConfig,
): Promise<void> {
  const { githubOwner, githubRepo, dryRun } = envConfig;
  const threadId = thread.id;
  const guildId = thread.guildId;

  // Bot 自身が作成したスレッドは除外
  const botId = thread.client.user?.id;
  if (botId && thread.ownerId === botId) {
    logger.debug('skipping_bot_thread', { thread_id: threadId });
    return;
  }

  // DB 重複確認
  const existing = findByThreadId(db, threadId);
  if (existing) {
    logger.info('already_linked', {
      thread_id: threadId,
      github_issue_url: existing.github_issue_url,
    });
    if (appConfig.replyWhenAlreadyLinked) {
      await thread.send(
        `このスレッドは既にIssue化済みだぞ。\n\n${existing.github_issue_url}`,
      );
    }
    return;
  }

  // 開始メッセージ取得（レースコンディション対策のリトライ付き）
  const bodyText = await fetchStarterMessageWithRetry(thread);

  // タグ取得
  const parentChannel = thread.parent;
  const availableTags =
    parentChannel && 'availableTags' in parentChannel ? parentChannel.availableTags : [];
  const tagNames = resolveTagNames(thread.appliedTags, availableTags);

  // ignoreTags 判定
  if (hasIgnoreTag(tagNames, appConfig.ignoreTags)) {
    logger.info('skipping_ignored_tags', { thread_id: threadId, tags: tagNames });
    return;
  }

  // タグ → ラベル変換
  const desiredLabels = mapToGitHubLabels(tagNames, appConfig.tagMap);
  let labels: string[] = [];
  if (desiredLabels.length > 0) {
    const existingLabelNames = await getExistingLabelNames(octokit, githubOwner, githubRepo);
    const { valid } = filterLabels(desiredLabels, existingLabelNames);
    labels = valid;
  }

  // 投稿者情報
  const starterMessage = await thread.fetchStarterMessage({ force: true }).catch(() => null);
  const authorId = starterMessage?.author?.id ?? thread.ownerId ?? 'unknown';
  const authorName = starterMessage?.author?.username ?? 'unknown';
  const attachmentUrls = starterMessage ? [...starterMessage.attachments.values()].map((a) => a.url) : [];
  const channelId = thread.parentId ?? thread.id;

  const url = threadUrl(guildId, threadId);

  const postData = {
    threadId,
    threadName: thread.name,
    threadUrl: url,
    guildId,
    channelId,
    authorId,
    authorName,
    body: bodyText,
    attachmentUrls,
    tagNames,
    createdAt: thread.createdAt ?? new Date(),
  };

  const title = buildTitle(postData.threadName);
  const issueBody = buildBody(postData);

  // GitHub Issue 作成
  let created: { number: number; url: string };
  try {
    created = await createIssue(octokit, {
      owner: githubOwner,
      repo: githubRepo,
      title,
      body: issueBody,
      labels,
      dryRun,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('issue_create_failed', { thread_id: threadId, error: message });
    await thread.send('GitHub Issueの作成に失敗した。\n\n管理者がログを確認してくれ。').catch(() => undefined);
    return;
  }

  // DB 保存（DRY_RUN 時もスキップ）
  if (!dryRun) {
    try {
      insert(db, {
        discord_guild_id: guildId,
        discord_channel_id: channelId,
        discord_thread_id: threadId,
        discord_thread_url: url,
        github_owner: githubOwner,
        github_repo: githubRepo,
        github_issue_number: created.number,
        github_issue_url: created.url,
        created_by_discord_user_id: authorId,
        created_by_discord_username: authorName,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('db_insert_failed', {
        level: 'critical',
        thread_id: threadId,
        github_issue_url: created.url,
        error: message,
      });
      // Issue URL は Discord へ返信して手動復旧できるようにする
    }
  }

  // Discord 返信
  if (appConfig.replyWhenCreated) {
    await thread.send(`GitHub Issueを作成したぞ。\n\n${created.url}`).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('discord_reply_failed', { thread_id: threadId, error: message });
    });
  }

  logger.info('issue_created', {
    discord_thread_id: threadId,
    github_issue_number: created.number,
    github_issue_url: created.url,
    dry_run: dryRun,
  });
}
