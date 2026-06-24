import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterLabels } from './labels.js';

// logger をモック（副作用なし）
vi.mock('../utils/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

describe('filterLabels', () => {
  const existingLabels = new Set(['bug', 'enhancement', 'question']);

  it('既存ラベルのみを valid に返す', () => {
    const { valid, missing } = filterLabels(['bug', 'enhancement'], existingLabels);
    expect(valid).toEqual(['bug', 'enhancement']);
    expect(missing).toEqual([]);
  });

  it('存在しないラベルは missing に返す', () => {
    const { valid, missing } = filterLabels(['bug', 'nonexistent'], existingLabels);
    expect(valid).toEqual(['bug']);
    expect(missing).toEqual(['nonexistent']);
  });

  it('全て存在しない場合は valid が空', () => {
    const { valid, missing } = filterLabels(['foo', 'bar'], existingLabels);
    expect(valid).toEqual([]);
    expect(missing).toEqual(['foo', 'bar']);
  });

  it('空配列を渡すと両方空', () => {
    const { valid, missing } = filterLabels([], existingLabels);
    expect(valid).toEqual([]);
    expect(missing).toEqual([]);
  });
});
