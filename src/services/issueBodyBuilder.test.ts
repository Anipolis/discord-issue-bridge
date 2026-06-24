import { describe, it, expect } from 'vitest';
import { escapeMentions, buildTitle, buildBody } from './issueBodyBuilder.js';
import type { ForumPostData } from '../types/index.js';

const basePost: ForumPostData = {
  threadId: '111222333',
  threadName: 'ログイン時に画面が真っ白になる',
  threadUrl: 'https://discord.com/channels/guild/111222333',
  guildId: 'guild',
  channelId: 'channel',
  authorId: 'user123',
  authorName: 'testuser',
  body: 'ログインしたら真っ白になります。',
  attachmentUrls: ['https://cdn.discord.com/image.png'],
  tagNames: ['バグ'],
  createdAt: new Date('2026-06-24T10:00:00.000Z'),
};

describe('escapeMentions', () => {
  it('@everyoneをエスケープする', () => {
    expect(escapeMentions('@everyone こんにちは')).toContain('@​everyone');
  });

  it('@hereをエスケープする', () => {
    expect(escapeMentions('@here 確認してください')).toContain('@​here');
  });

  it('通常テキストは変更しない', () => {
    expect(escapeMentions('普通のテキスト')).toBe('普通のテキスト');
  });
});

describe('buildTitle', () => {
  it('スレッド名をそのままタイトルにする', () => {
    expect(buildTitle('バグ報告: ログインできない')).toBe('バグ報告: ログインできない');
  });
});

describe('buildBody', () => {
  it('投稿本文を含む', () => {
    expect(buildBody(basePost)).toContain('ログインしたら真っ白になります。');
  });

  it('投稿者情報を含む', () => {
    const body = buildBody(basePost);
    expect(body).toContain('testuser');
    expect(body).toContain('user123');
  });

  it('スレッドURLを含む', () => {
    expect(buildBody(basePost)).toContain('https://discord.com/channels/guild/111222333');
  });

  it('添付ファイルURLを含む', () => {
    expect(buildBody(basePost)).toContain('https://cdn.discord.com/image.png');
  });

  it('本文が空の場合は「本文なし」と記載する', () => {
    expect(buildBody({ ...basePost, body: '' })).toContain('本文なし');
  });

  it('添付ファイルがない場合は「添付ファイルなし」と記載する', () => {
    expect(buildBody({ ...basePost, attachmentUrls: [] })).toContain('添付ファイルなし');
  });

  it('Bot 署名を含む', () => {
    expect(buildBody(basePost)).toContain('Discord Forum to GitHub Issue Bot');
  });

  it('@everyoneをエスケープする', () => {
    const body = buildBody({ ...basePost, body: '@everyone 全員注目' });
    expect(body).not.toContain('@everyone 全員注目');
  });
});
