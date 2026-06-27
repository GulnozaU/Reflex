import { LoopMatch } from './types';
import { fileShapeKey } from './repeatTracker';

export const PROMPT_THRESHOLD = 3;

export interface ApprovalStats {
  /** Total hits including the current match (prior recorded + this one). */
  occurrenceCount: number;
  /** Measured minutes from prior occurrences plus this match. */
  totalMinutesSpent: number;
  shouldPrompt: boolean;
}

export function computeApprovalStats(
  priorCount: number,
  priorMinutes: number,
  match: LoopMatch
): ApprovalStats {
  return {
    occurrenceCount: priorCount + 1,
    totalMinutesSpent: priorMinutes + match.minutesElapsed,
    shouldPrompt: priorCount >= PROMPT_THRESHOLD
  };
}

export function occurrenceMatchKey(match: LoopMatch): string {
  return `${match.loopType}:${fileShapeKey(match.filesInvolved)}:${match.traceIds.join('|')}`;
}
