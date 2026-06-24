import { describe, it, expect } from 'vitest';
import { resolveTagNames, hasIgnoreTag, mapToGitHubLabels } from './tagMapper.js';

const availableTags = [
  { id: '111', name: 'バグ' },
  { id: '222', name: '機能要望' },
  { id: '333', name: '雑談' },
];

describe('resolveTagNames', () => {
  it('タグIDをタグ名に変換する', () => {
    expect(resolveTagNames(['111', '222'], availableTags)).toEqual(['バグ', '機能要望']);
  });

  it('存在しないIDはスキップする', () => {
    expect(resolveTagNames(['999'], availableTags)).toEqual([]);
  });

  it('空配列は空を返す', () => {
    expect(resolveTagNames([], availableTags)).toEqual([]);
  });
});

describe('hasIgnoreTag', () => {
  it('ignoreTagsに含まれるタグがあればtrue', () => {
    expect(hasIgnoreTag(['バグ', '雑談'], ['雑談'])).toBe(true);
  });

  it('ignoreTagsに含まれるタグがなければfalse', () => {
    expect(hasIgnoreTag(['バグ', '機能要望'], ['雑談'])).toBe(false);
  });

  it('タグが空ならfalse', () => {
    expect(hasIgnoreTag([], ['雑談'])).toBe(false);
  });
});

describe('mapToGitHubLabels', () => {
  const tagMap = { バグ: 'bug', 不具合: 'bug', 機能要望: 'enhancement' };

  it('タグ名をGitHubラベルに変換する', () => {
    expect(mapToGitHubLabels(['バグ', '機能要望'], tagMap)).toEqual(['bug', 'enhancement']);
  });

  it('同じラベルへのマッピングは重複排除する', () => {
    expect(mapToGitHubLabels(['バグ', '不具合'], tagMap)).toEqual(['bug']);
  });

  it('マッピング定義がないタグはスキップする', () => {
    expect(mapToGitHubLabels(['質問'], tagMap)).toEqual([]);
  });

  it('空配列は空を返す', () => {
    expect(mapToGitHubLabels([], tagMap)).toEqual([]);
  });
});
