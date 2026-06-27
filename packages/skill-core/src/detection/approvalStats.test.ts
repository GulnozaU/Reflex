import { describe, expect, it } from 'vitest';
import { LoopMatch } from './types';
import { computeApprovalStats, PROMPT_THRESHOLD } from './approvalStats';

describe('computeApprovalStats', () => {
  const match: LoopMatch = {
    loopType: 'TYPE_ERROR_LOOP',
    traceIds: ['t1', 't2', 't3'],
    filesInvolved: ['src/auth.ts'],
    errorSnippet: 'TS2339',
    minutesElapsed: 1.2
  };

  it('occurrenceCount is inclusive of the current match (prior + 1)', () => {
    const stats = computeApprovalStats(3, 4.5, match);
    expect(stats.occurrenceCount).toBe(4);
    expect(stats.totalMinutesSpent).toBeCloseTo(5.7);
    expect(stats.shouldPrompt).toBe(true);
  });

  it('does not prompt below threshold; count still includes current match', () => {
    const stats = computeApprovalStats(2, 2.0, match);
    expect(stats.occurrenceCount).toBe(3);
    expect(stats.shouldPrompt).toBe(false);
    expect(PROMPT_THRESHOLD).toBe(3);
  });

  it('prompts when priorCount equals threshold (4th hit overall)', () => {
    const stats = computeApprovalStats(PROMPT_THRESHOLD, 3.0, match);
    expect(stats.occurrenceCount).toBe(4);
    expect(stats.shouldPrompt).toBe(true);
  });
});
