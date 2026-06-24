import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterLabels } from './labels.js';
import { logger } from '../utils/logger.js';

vi.mock('../utils/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

describe('filterLabels', () => {
  const existingLabels = new Set(['bug', 'enhancement', 'question']);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('既存ラベルのみを valid に返す', () => {
    const { valid, missing } = filterLabels(['bug', 'enhancement'], existingLabels);
    expect(valid).toEqual(['bug', 'enhancement']);
    expect(missing).toEqual([]);
  });

  it('存在しないラベルは missing に返す', () => {
    const { valid, missing } = filterLabels(['bug', 'nonexistent'], existingLabels);
    expect(valid).toEqual(['bug']);
    expect(missing).toEqual(['nonexistent']);
    expect(logger.warn).toHaveBeenCalledWith('labels_not_found', { missing: ['nonexistent'] });
  });

  it('全て存在しない場合は valid が空', () => {
    const { valid, missing } = filterLabels(['foo', 'bar'], existingLabels);
    expect(valid).toEqual([]);
    expect(missing).toEqual(['foo', 'bar']);
    expect(logger.warn).toHaveBeenCalledWith('labels_not_found', { missing: ['foo', 'bar'] });
  });

  it('空配列を渡すと両方空でログなし', () => {
    const { valid, missing } = filterLabels([], existingLabels);
    expect(valid).toEqual([]);
    expect(missing).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
