import type { ForumPostData } from '../types/index.js';

export function escapeMentions(text: string): string {
  return text
    .replace(/@everyone/g, '@​everyone')
    .replace(/@here/g, '@​here')
    .replace(/(^|[^A-Za-z0-9-])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/g, '$1@​$2');
}

export function buildTitle(threadName: string): string {
  return escapeMentions(threadName);
}

export function buildBody(post: ForumPostData): string {
  const body = post.body.trim() ? escapeMentions(post.body) : '本文なし';
  const authorName = escapeMentions(post.authorName);
  const tags =
    post.tagNames.length > 0 ? post.tagNames.map(escapeMentions).join(', ') : 'なし';
  const attachments =
    post.attachmentUrls.length > 0 ? post.attachmentUrls.join('\n') : '添付ファイルなし';
  const createdAt = post.createdAt.toISOString();

  return `## Discord投稿内容

${body}

## 投稿情報

- 投稿者: ${authorName} / ${post.authorId}
- Discordスレッド: ${post.threadUrl}
- Discordタグ: ${tags}
- 投稿日時: ${createdAt}

## 添付ファイル

${attachments}

---

このIssueはDiscord Forum to GitHub Issue Botによって自動作成されました。`;
}
